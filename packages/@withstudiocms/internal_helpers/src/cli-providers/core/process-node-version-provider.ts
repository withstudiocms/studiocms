import type { NodeVersionProvider } from '../definitions.js';

/**
 * Provides the Node.js version from the current process.
 */
export class ProcessNodeVersionProvider implements NodeVersionProvider {
	readonly version: string = process.version;
}
