import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { intro, tasks } from '@withstudiocms/effect/clack';
import { Cli, Effect, Layer, PlatformNode } from '@withstudiocms/effect/effect';
import { readJson } from '@withstudiocms/internal_helpers/utils';
import { CommandConfig } from './args.ts';
import { type EffectStepFn, getContext } from './context.ts';
import { dependencies } from './steps/dependencies.ts';
import { git } from './steps/git.ts';
import { intro as introStep } from './steps/intro.ts';
import { next } from './steps/next.ts';
import { projectName } from './steps/projectName.ts';
import { template } from './steps/template.ts';
import { verify } from './steps/verify.ts';

/**
 * Get the package.json data for this package
 */
const pkgJson = readJson<{ version: string }>(new URL('../package.json', import.meta.url));

/**
 * Define the CLI command for the create-studiocms application
 */
const command = Cli.Command.make(
	'create-studiocms',
	CommandConfig,
	Effect.fn(function* (options) {
		// Log starting messages
		yield* Effect.all([
			Effect.logDebug('Starting interactive CLI...'),
			Effect.logDebug(`Options: ${JSON.stringify(options, null, 2)}`),
			intro(`${label('StudioCMS', StudioCMSColorwayBg, 'black')} Project Setup`),
		]);

		// Get the current context
		const context = yield* getContext(options).pipe(
			Effect.tap((data) => Effect.logDebug(`Context obtained: ${JSON.stringify(data, null, 2)}`))
		);

		// Define the steps to execute
		const steps: EffectStepFn[] = [
			verify,
			introStep,
			projectName,
			template,
			dependencies,
			// --- Steps which write files should go above this line ---
			git,
		];

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
		yield* Effect.all([
			Effect.logDebug('Project setup process completed. Preparing to exit...'),
			next(context),
			Effect.logDebug('Exiting with code 0...'),
		]);

		// Exit successfully
		process.exit(0);
	})
).pipe(Cli.Command.withDescription('Interactive StudioCMS project creation CLI'));

/**
 * Set up the CLI application
 */
const cli = Cli.Command.run(command, {
	name: 'StudioCMS Project Creation CLI',
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
