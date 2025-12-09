import type { PackageManager } from '../definitions.js';

/**
 * Represents the PNPM package manager.
 */
export class PnpmPackageManager implements PackageManager {
	readonly name: string = 'pnpm';
}
