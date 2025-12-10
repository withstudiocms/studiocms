import type { PackageManager } from '../definitions.js';

/**
 * Represents a no-operation package manager for unknown cases.
 */
export class NoopPackageManager implements PackageManager {
	readonly name: string = 'unknown';

	async getPackageVersion(_name: string): Promise<string | undefined> {
		return undefined;
	}
}
