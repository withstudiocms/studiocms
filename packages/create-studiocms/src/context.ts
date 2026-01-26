import os from 'node:os';
import { detectPackageManager } from '@withstudiocms/cli-kit/context';
import { getName, random } from '@withstudiocms/cli-kit/messages';
import type { Task } from '@withstudiocms/effect/clack';
import { Data, Effect } from '@withstudiocms/effect/effect';
import packageJson from 'package-json';
import { templateRegistry } from './templates.config.ts';
import type { TemplateRegistry } from './types.ts';
import getSeasonalMessages from './utils/messages.ts';

/**
 * Interactive Options Interface
 */
export interface InteractiveOptions {
	template?: string;
	templateRef?: string;
	projectName?: string;
	install?: boolean;
	doNotInstall?: boolean;
	git?: boolean;
	doNotInitGit?: boolean;
	dryRun?: boolean;
	yes?: boolean;
	no?: boolean;
	skipBanners?: boolean;
	debug?: boolean;
}

/**
 * Execution Context Interface
 */
export interface Context extends InteractiveOptions {
	cwd: string;
	packageManager: string;
	username: string;
	welcome: string;
	version: string;
	exit(code: number): never;
	tasks: Task[];
	isStudioCMSProject: boolean;
	templateRegistry: TemplateRegistry;
}

/**
 * Get the execution context for the StudioCMS project setup process.
 *
 * @param args - The interactive options provided by the user.
 * @returns An Effect that produces the Context object.
 */
export const getContext = Effect.fn('getContext')(function* (
	args: InteractiveOptions & { cwd?: string }
) {
	let {
		skipBanners,
		dryRun,
		git,
		install,
		doNotInitGit,
		doNotInstall,
		debug,
		template,
		yes,
		no,
		projectName,
		templateRef,
	} = args;

	const packageManager = detectPackageManager() ?? 'npm';
	const cwd = args.cwd ?? process.cwd();

	const { version } = yield* Effect.promise(() => packageJson('studiocms'));

	if (no) {
		yes = false;
		if (install === undefined) install = false;
		if (git === undefined) git = false;
	}

	skipBanners =
		(os.platform() === 'win32' || skipBanners) ??
		[yes, no, git, install].some((v) => v !== undefined);

	const { messages } = getSeasonalMessages();

	const context: Context = {
		packageManager,
		username: yield* Effect.promise(() => getName()),
		version,
		dryRun,
		projectName,
		template,
		debug,
		templateRef: templateRef ?? 'main',
		welcome: random(messages),
		yes,
		no,
		install: install ?? (doNotInstall ? false : undefined),
		git: git ?? (doNotInitGit ? false : undefined),
		cwd,
		skipBanners,
		exit(code) {
			process.exit(code);
		},
		tasks: [],
		isStudioCMSProject: false,
		templateRegistry,
	};
	return context;
});

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
