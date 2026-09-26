import type { PackageManagerUserAgentProvider } from '../definitions.js';

/**
 * Provides the package manager user agent from the current process environment.
 */
export class ProcessPackageManagerUserAgentProvider implements PackageManagerUserAgentProvider {
	// https://docs.npmjs.com/cli/v8/using-npm/config#user-agent
	readonly userAgent: string | null = process.env.npm_config_user_agent ?? null;
}
