import { exportBackup } from './stores.svelte.ts';

let fileHandle: FileSystemFileHandle | null = null;

/**
 * 1-Tap Save to Google Drive / Cloud Storage.
 * On mobile browsers (especially Android Chrome on Pixel 9 Pro), navigator.share with files
 * triggers the system share sheet containing "Save to Drive", Files, etc.
 * Falls back to standard direct file download if Web Share API is unavailable.
 */
export async function shareToCloudOrDrive(): Promise<{ method: 'share' | 'download'; success: boolean }> {
	const jsonContent = await exportBackup();
	const filename = `stretch-timer-backup-${new Date().toISOString().slice(0, 10)}.json`;
	const blob = new Blob([jsonContent], { type: 'application/json' });
	const file = new File([blob], filename, { type: 'application/json' });

	if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
		try {
			await navigator.share({
				title: 'Stretch Timer Backup',
				text: 'Offline backup of Stretch Timer routines and streak history.',
				files: [file]
			});
			return { method: 'share', success: true };
		} catch (err) {
			// If user cancelled share sheet, return gracefully without triggering redundant download
			if ((err as Error).name === 'AbortError') {
				return { method: 'share', success: false };
			}
		}
	}

	// Fallback: direct download
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
	return { method: 'download', success: true };
}

/**
 * File System Access API: Link a local backup file on disk / cloud-synced folder
 * that can be auto-saved silently whenever routines change.
 */
export function hasFileSystemAccessSupport(): boolean {
	return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

export function isFileAutoBackupConnected(): boolean {
	return fileHandle !== null;
}

export async function connectFileAutoBackup(): Promise<boolean> {
	if (!hasFileSystemAccessSupport()) return false;
	try {
		const handle = await (window as unknown as {
			showSaveFilePicker: (options: {
				suggestedName: string;
				types: Array<{ description: string; accept: Record<string, string[]> }>;
			}) => Promise<FileSystemFileHandle>;
		}).showSaveFilePicker({
			suggestedName: `stretch-timer-autobackup.json`,
			types: [
				{
					description: 'JSON Backup File',
					accept: { 'application/json': ['.json'] }
				}
			]
		});
		fileHandle = handle;
		await autoSaveToFileHandle();
		return true;
	} catch {
		return false;
	}
}

export function disconnectFileAutoBackup(): void {
	fileHandle = null;
}

export async function autoSaveToFileHandle(): Promise<boolean> {
	if (!fileHandle) return false;
	try {
		const json = await exportBackup();
		const writable = await (fileHandle as unknown as { createWritable: () => Promise<FileSystemWritableFileStream> }).createWritable();
		await writable.write(json);
		await writable.close();
		return true;
	} catch {
		fileHandle = null;
		return false;
	}
}
