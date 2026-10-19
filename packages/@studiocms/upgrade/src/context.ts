import { pathToFileURL } from 'node:url';
import type { Task } from '@withstudiocms/effect/clack';
import { Data, Effect } from 'effect';
import { type DetectResult, detect } from 'package-manager-detector';

/**
 * Custom error class for CLI context-related errors.
 *
 * @remarks
 * This error extends the TaggedError class from the Data module and includes a cause property
 * to capture the underlying error that triggered the context error.
 *
 * @example
 * ```typescript
 * throw new CLIContextError({ cause: new Error('Failed to obtain CLI context') });
 * ```
 */
export class CLIContextError extends Data.TaggedError('CLIContextError')<{ cause: unknown }> {}

/**
 * Custom error class for CLI-related errors.
 *
 * @remarks
 * This error extends the TaggedError class from the Data module and includes a cause property
 * to capture the underlying error that triggered the CLI error.
 *
 * @example
 * ```typescript
 * throw new CLIError({ cause: new Error('Failed to execute command') });
 * ```
 */
export class CLIError extends Data.TaggedError('CLIError')<{ cause: unknown }> {}

/**
 * Represents information about a package that can be upgraded.
 *
 * @interface PackageInfo
 * @property {string} name - The name of the package.
 * @property {string} currentVersion - The currently installed version of the package.
 * @property {string} targetVersion - The target version to upgrade to.
 * @property {string} [tag] - Optional tag associated with the package version (e.g., 'latest', 'beta').
 * @property {boolean} [isDevDependency] - Optional flag indicating if the package is a development dependency.
 * @property {boolean} [isMajor] - Optional flag indicating if the upgrade involves a major version change.
 * @property {string} [changelogURL] - Optional URL to the package's changelog.
 * @property {string} [changelogTitle] - Optional title or description for the changelog.
 */
export interface PackageInfo {
	name: string;
	currentVersion: string;
	targetVersion: string;
	tag?: string;
	isDevDependency?: boolean;
	isMajor?: boolean;
	changelogURL?: string;
	changelogTitle?: string;
}

/**
 * Represents the execution context for the StudioCMS upgrade process.
 *
 * @interface Context
 *
 * @property {string} version - The current version of the upgrade tool or package being processed.
 * @property {boolean} dryRun - Indicates whether the upgrade should run in dry-run mode without making actual changes.
 * @property {URL} cwd - The current working directory as a URL object.
 * @property {typeof process.stdin} [stdin] - Optional standard input stream for reading user input.
 * @property {typeof process.stdout} [stdout] - Optional standard output stream for writing output.
 * @property {DetectResult} packageManager - Information about the detected package manager (npm, yarn, pnpm, etc.).
 * @property {PackageInfo[]} packages - Array of package information objects to be processed during the upgrade.
 * @property {(code: number) => never} exit - Function to exit the process with the specified exit code.
 * @property {Task[]} tasks - Array of tasks to be executed during the upgrade process.
 */
export interface Context {
	version: string;
	dryRun: boolean;
	cwd: URL;
	stdin?: typeof process.stdin;
	stdout?: typeof process.stdout;
	packageManager: DetectResult;
	packages: PackageInfo[];
	exit(code: number): never;
	tasks: Task[];
}

/**
 * A function type that represents a step in the upgrade process.
 *
 * @param context - The context object containing the current state and configuration
 * @returns An Effect that produces void on success, or a CLIError on failure
 *
 * @remarks
 * This function type is used to define individual steps in the upgrade workflow.
 * Each step receives the current context and returns an Effect that either completes
 * successfully (void) or fails with a CLIError. The Effect has no requirements (never).
 */
export type EffectStepFn = (context: Context) => Effect.Effect<void, CLIError, never>;

/**
 * A function type that creates and returns a CLI context object.
 *
 * @param version - Optional version string to set in the context
 * @param dryRun - Optional boolean flag to indicate dry-run mode
 * @returns An Effect that produces a Context object with no requirements (never)
 */
export type GetContext = (
	version?: string,
	dryRun?: boolean
) => Effect.Effect<Context, never, never>;

/**
 * Creates and returns a CLI context object with configuration for package management and execution.
 *
 * This generator function detects the package manager being used in the current project,
 * sets up the execution context with the specified version and dry-run settings, and
 * provides utilities for managing packages and tasks.
 *
 * @param version - The version to use for operations. Defaults to 'latest'.
 * @param dryRun - Whether to run in dry-run mode without making actual changes. Defaults to false.
 *
 * @returns A Context object containing:
 * - `version`: The specified version string
 * - `dryRun`: The dry-run flag
 * - `cwd`: The current working directory as a file URL
 * - `packageManager`: The detected package manager (npm, yarn, pnpm, etc.) or defaults to npm
 * - `packages`: An empty array to store package information
 * - `exit`: A function to exit the process with a given exit code
 * - `tasks`: An empty array to store tasks
 *
 * @throws {CLIContextError} If package manager detection fails, logs a warning and continues with npm as default
 *
 * @example
 * ```typescript
 * const context = yield* getContext('1.0.0', true);
 * console.log(context.packageManager.name); // 'npm' or detected manager
 * ```
 */
export const getContext: GetContext = Effect.fn(function* (version = 'latest', dryRun = false) {
	let packageManager: DetectResult | null = null;

	yield* Effect.tryPromise({
		try: async () => {
			packageManager = await detect({
				// Include the `install-metadata` strategy to have the package manager that's
				// used for installation take precedence
				strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
			});
		},
		catch: (cause) => new CLIContextError({ cause }),
	}).pipe(Effect.catchTag('CLIContextError', Effect.logWarning));

	packageManager = packageManager ?? { agent: 'npm', name: 'npm' };

	return {
		version,
		dryRun,
		cwd: new URL(`${pathToFileURL(process.cwd())}/`),
		packageManager,
		packages: [],
		exit: (code: number) => {
			process.exit(code);
		},
		tasks: [],
	} satisfies Context;
});
