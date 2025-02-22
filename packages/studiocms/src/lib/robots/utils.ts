import fs from 'node:fs';

/**
 * Reads a JSON file from the specified path and parses its content.
 *
 * @template T - The type of the parsed JSON object.
 * @param {string | URL} path - The path to the JSON file.
 * @returns {T} The parsed JSON object.
 */
export function readJson<T>(path: string | URL): T {
	return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

/**
 * Measures the execution time of a given callback function.
 *
 * @param callback - The function whose execution time is to be measured.
 * @returns The execution time of the callback function in milliseconds.
 */
export function measureExecutionTime(callback: () => void): number {
	const startTime = performance.now();
	callback();
	const endTime = performance.now();
	const executionTime = Math.floor(endTime - startTime);
	return executionTime;
}

/**
 * Calculates the size of a file in kilobytes.
 *
 * @param filename - The URL of the file to get the size of.
 * @returns The size of the file in kilobytes.
 */
export function getFileSizeInKilobytes(filename: URL): number {
	const stats = fs.statSync(filename);
	const fileSizeInBytes = stats.size;
	const fileSizeInKilobytes = fileSizeInBytes / 1024;
	return fileSizeInKilobytes;
}
