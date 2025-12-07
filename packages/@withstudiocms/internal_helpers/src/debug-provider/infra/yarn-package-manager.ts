import type { PackageManager } from '../definitions.js';

/**
 * Represents the Yarn package manager.
 */
export class YarnPackageManager implements PackageManager {
	readonly name: string = 'yarn';
}
