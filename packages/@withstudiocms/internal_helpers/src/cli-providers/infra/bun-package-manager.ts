import type { PackageManager } from '../definitions.js';

/**
 * Represents the Bun package manager.
 */
export class BunPackageManager implements PackageManager {
	readonly name: string = 'bun';

	async getPackageVersion(_name: string): Promise<string | undefined> {
		return undefined;
	}
}
