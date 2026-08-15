export interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

class PwaState {
	deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	isStandalone = $state(false);
	isInstalled = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.isStandalone =
				window.matchMedia('(display-mode: standalone)').matches ||
				(window.navigator as unknown as { standalone?: boolean }).standalone === true;

			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				this.deferredPrompt = e as BeforeInstallPromptEvent;
			});

			window.addEventListener('appinstalled', () => {
				this.deferredPrompt = null;
				this.isInstalled = true;
			});
		}
	}

	async install(): Promise<boolean> {
		if (!this.deferredPrompt) return false;
		try {
			await this.deferredPrompt.prompt();
			const choice = await this.deferredPrompt.userChoice;
			if (choice.outcome === 'accepted') {
				this.isInstalled = true;
				this.deferredPrompt = null;
				return true;
			}
		} catch {
			// user dismissed or prompt failed
		}
		return false;
	}
}

export const pwa = new PwaState();
