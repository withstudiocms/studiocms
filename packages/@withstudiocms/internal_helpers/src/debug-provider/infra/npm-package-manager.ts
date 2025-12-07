import type { PackageManager } from '../definitions.js';

/**
 * Represents the NPM package manager.
 */
export class NpmPackageManager implements PackageManager {
	readonly name: string = 'npm';
}
