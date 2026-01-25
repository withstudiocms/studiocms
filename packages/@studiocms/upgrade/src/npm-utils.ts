import { exec } from '@withstudiocms/cli-kit/utils';
import { Effect } from '@withstudiocms/effect/effect';
import { detect as _detect, type DetectResult } from 'package-manager-detector';
import { CLIError } from './context.ts';

/**
 * Effect to detect the package manager being used in the current project.
 *
 * @remarks
 * This effect attempts to detect the package manager using the `package-manager-detector` library.
 * If detection fails, it logs an error and returns `null` instead of throwing.
 */
const eDetect = Effect.tryPromise({
	try: () => _detect(),
	catch: (error) => new CLIError({ cause: `Failed to detect package manager: ${String(error)}` }),
}).pipe(
	Effect.catchTag(
		'CLIError',
		Effect.fn(function* (error) {
			yield* Effect.logError(String(error.cause));
			return yield* Effect.succeed<DetectResult | null>(null);
		})
	)
);

/**
 * Effect to execute a command using the detected package manager.
 *
 * @param command - The command to execute.
 * @param args - Optional arguments for the command.
 *
 * @returns An Effect that resolves with the command's output or fails with an error.
 */
const eExec = (command: string, args?: string[] | undefined) =>
	Effect.tryPromise(() => exec(command, args));

// Users might lack access to the global npm registry, this function
// checks the user's project type and will return the proper npm registry
//
// This function is adapted from similar utilities in other projects
let _registry: string;

/**
 * Effect to get the npm registry URL being used by the detected package manager.
 */
export const getRegistry = Effect.gen(function* () {
	if (_registry) return _registry;

	const fallback = 'https://registry.npmjs.org';
	const packageManager = (yield* eDetect)?.name || 'npm';

	_registry = yield* eExec(packageManager, ['config', 'get', 'registry']).pipe(
		Effect.map(({ stdout }) => stdout.trim()?.replace(/\/$/, '') || fallback),
		Effect.catchAll(
			Effect.fn(function* (error) {
				yield* Effect.logError(
					`Error fetching registry from ${packageManager}, defaulting to npm registry: ${String(
						error
					)}`
				);
				return yield* Effect.succeed(fallback);
			})
		)
	);

	yield* Effect.try({
		try: () => {
			const url = new URL(_registry);
			if (!url.host || !['http:', 'https:'].includes(url.protocol)) _registry = fallback;
		},
		catch: () => new CLIError({ cause: 'Invalid registry URL detected' }),
	}).pipe(
		Effect.catchTag(
			'CLIError',
			Effect.fn(function* (error) {
				yield* Effect.logError(`Error validating registry URL: ${String(error.cause)}`);
				_registry = fallback;
			})
		)
	);

	return _registry;
});
