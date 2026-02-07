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

/**
 * Represents debug information about the environment.
 */
export interface CommandExecutorOptions {
	cwd?: string;
	env?: Record<string, string | undefined>;
	shell?: boolean;
	input?: string;
	stdio?: StdioOptions;
}

/**
 * Represents a command executor that can run shell commands.
 */
export interface CommandExecutor {
	execute: (
		command: string,
		args?: Array<string>,
		options?: CommandExecutorOptions
	) => Promise<{ stdout: string }>;
}

/**
 * Represents the structure of a bare NPM-like version output.
 */
export interface BareNpmLikeVersionOutput {
	version: string;
	dependencies: Record<string, BareNpmLikeVersionOutput>;
}

/**
 * Represents a text formatter for styling output.
 */
export interface TextFormatter {
	format: (styled?: boolean) => string;
}
