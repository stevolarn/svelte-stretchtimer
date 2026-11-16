/** A single app-wide toast, optionally with an undo-style action. */
export interface Toast {
	id: number;
	message: string;
	action?: string;
	onAction?: () => void;
}

export const toast = $state<{ current: Toast | null }>({ current: null });

let timer: ReturnType<typeof setTimeout> | undefined;
let pendingExpire: (() => void) | undefined;
let nextId = 1;

function finish(): void {
	clearTimeout(timer);
	const expire = pendingExpire;
	pendingExpire = undefined;
	toast.current = null;
	expire?.();
}

/**
 * Show a toast. `onExpire` runs when the toast goes away without its action
 * being used (timeout, dismissal or a newer toast replacing it).
 */
export function showToast(
	message: string,
	options: { action?: string; onAction?: () => void; onExpire?: () => void; duration?: number } = {}
): void {
	finish();
	toast.current = { id: nextId++, message, action: options.action, onAction: options.onAction };
	pendingExpire = options.onExpire;
	timer = setTimeout(finish, options.duration ?? (options.action ? 6000 : 3000));
}

export function runToastAction(): void {
	const current = toast.current;
	pendingExpire = undefined;
	clearTimeout(timer);
	toast.current = null;
	current?.onAction?.();
}

export function dismissToast(): void {
	finish();
}
