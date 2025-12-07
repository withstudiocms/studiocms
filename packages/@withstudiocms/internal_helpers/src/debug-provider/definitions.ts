/**
 * Defines interfaces for package managers, Node.js version, and system information providers.
 */
export interface PackageManager {
	readonly name: string;
}

/**
 * Provides the user agent string of the package manager.
 */
export interface PackageManagerUserAgentProvider {
	readonly userAgent: string | null;
}

/**
 * Provides the Node.js version.
 */
export interface NodeVersionProvider {
	readonly version: string;
}

/**
 * Provides system information.
 */
export interface SystemInfoProvider {
	readonly name: NodeJS.Platform;
	readonly displayName: string;
}
