import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label, random, say } from '@withstudiocms/cli-kit/messages';
import { intro, tasks } from '@withstudiocms/effect/clack';
import { Cli, Effect, Layer, PlatformNode } from '@withstudiocms/effect/effect';
import { readJson } from '@withstudiocms/internal_helpers/utils';
import dotenv from 'dotenv';
import { dryRun, optVersion } from './args.ts';
import { CLIError, type EffectStepFn, getContext } from './context.ts';
import { bye, celebrations, done } from './messages.ts';
import { install } from './steps/install.ts';
import { verify } from './steps/verify.ts';

// Initialize environment variables
dotenv.config({ quiet: true });

/**
 * Get the package.json data for this package
 */
const pkgJson = readJson<{ version: string }>(new URL('../package.json', import.meta.url));

/**
 * Define the CLI command for the upgrade utility
 */
const command = Cli.Command.make(
	'@studiocms/upgrade',
	{ optVersion, dryRun },
	Effect.fn(function* ({ dryRun, optVersion }) {
		// Log starting messages
		yield* Effect.all([
			Effect.logDebug('Starting interactive CLI...'),
			Effect.logDebug(`Options: ${JSON.stringify({ optVersion, dryRun }, null, 2)}`),
			intro(`${label('StudioCMS', StudioCMSColorwayBg, 'black')} Upgrade Utility`),
		]);

		// Get the current context
		const context = yield* getContext(optVersion, dryRun).pipe(
			Effect.tap((data) => Effect.logDebug(`Context obtained: ${JSON.stringify(data, null, 2)}`))
		);

		// Define the steps to execute
		const steps: EffectStepFn[] = [verify, install];

		// Execute each step in sequence
		for (const step of steps) {
			yield* step(context);
		}

		// If there are tasks to run, execute them
		if (context.tasks.length > 0) {
			yield* Effect.logDebug(`Running ${context.tasks.length} tasks...`);
			yield* tasks(context.tasks);
			yield* Effect.logDebug('All tasks completed.');
		}

		// Log completion messages
		yield* Effect.logDebug('Upgrade process completed. Preparing to exit...');

		// Display a goodbye message
		yield* Effect.tryPromise({
			try: async () =>
				say([`${random(celebrations)} ${random(done)}`, random(bye)], { clear: false }),
			catch: () => new CLIError({ cause: 'Failed to display goodbye message' }),
		}).pipe(Effect.catchTag('CLIError', Effect.logWarning));

		// Log exiting message
		yield* Effect.logDebug('Exiting with code 0...');

		// Exit successfully
		context.exit(0);
	})
).pipe(Cli.Command.withDescription('StudioCMS CLI Upgrade Utility'));

/**
 * Set up the CLI application
 */
const cli = Cli.Command.run(command, {
	name: 'StudioCMS CLI Upgrade Utility',
	version: `v${pkgJson.version}`,
});

/**
 * Effect CLI Configuration Layer
 */
const ConfigLive = Cli.CliConfig.layer({
	showBuiltIns: true,
});

/**
 * Main Layer combining configuration and platform context
 */
const MainLayer = Layer.mergeAll(ConfigLive, PlatformNode.NodeContext.layer);

/**
 * Main entry point for the CLI application
 *
 * @returns An Effect that runs the CLI application
 */
export const main = () =>
	Effect.suspend(() => cli(process.argv)).pipe(
		Effect.provide(MainLayer),
		PlatformNode.NodeRuntime.runMain
	);
