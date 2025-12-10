import type { StdioOptions } from 'node:child_process';

/**
 * Defines interfaces for package managers, Node.js version, and system information providers.
 */
export interface PackageManager {
	readonly name: string;
	getPackageVersion: (name: string) => Promise<string | undefined>;
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

export interface CommandExecutorOptions {
	cwd?: string;
	env?: Record<string, string | undefined>;
	shell?: boolean;
	input?: string;
	stdio?: StdioOptions;
}

export interface CommandExecutor {
	execute: (
		command: string,
		args?: Array<string>,
		options?: CommandExecutorOptions
	) => Promise<{ stdout: string }>;
}
