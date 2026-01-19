/**
 * @module @withstudiocms/cli-kit/context
 *
 * This module provides functionality to create and manage the CLI context
 * for StudioCMS applications. It includes utilities for detecting the package
 * manager, gathering user information, and handling cancellation and exit
 * procedures in a consistent manner.
 */

/**
 * Detects the package manager being used to run the current process.
 *
 * @remarks
 * This function analyzes the `npm_config_user_agent` environment variable to determine
 * which package manager (npm, yarn, pnpm, bun, cnpm, etc.) is executing the current process.
 *
 * @returns The name of the detected package manager (e.g., 'npm', 'yarn', 'pnpm', 'bun', 'cnpm'),
 * or `undefined` if the package manager cannot be determined.
 *
 * @example
 * ```ts
 * const pm = detectPackageManager();
 * console.log(pm); // Output: 'npm', 'yarn', 'pnpm', etc.
 * ```
 */
export function detectPackageManager() {
	if (!process.env.npm_config_user_agent) return;
	const specifier = process.env.npm_config_user_agent.split(' ')[0];
	const name = specifier.substring(0, specifier.lastIndexOf('/'));
	return name === 'npminstall' ? 'cnpm' : name;
}
