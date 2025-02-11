import fs from 'node:fs';

export function readJson<T>(path: string | URL): T {
	return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

export function measureExecutionTime(callback: () => void): number {
	const startTime = performance.now();
	callback();
	const endTime = performance.now();
	const executionTime = Math.floor(endTime - startTime);
	return executionTime;
}

export function getFileSizeInKilobytes(filename: URL): number {
	const stats = fs.statSync(filename);
	const fileSizeInBytes = stats.size;
	const fileSizeInKilobytes = fileSizeInBytes / 1024;
	return fileSizeInKilobytes;
}
