import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { intro, log, multiselect, tasks } from '@withstudiocms/effect/clack';
import { Cli, Console, Effect, genLogger } from '../../effect.js';
import { CliContext, genContext } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { logger } from '../utils/logger.js';
import type { StepFn } from '../utils/types.js';
import { env } from './steps/env.js';
import { next } from './steps/next.js';

export const debug = Cli.Options.boolean('debug').pipe(
	Cli.Options.optional,
	Cli.Options.withDefault(false),
	Cli.Options.withDescription('Enable debug mode')
);

export const dryRun = Cli.Options.boolean('dry-run').pipe(
	Cli.Options.optional,
	Cli.Options.withAlias('d'),
	Cli.Options.withDescription('Dry run mode')
);

export const initCMD = Cli.Command.make('init', { debug, dryRun }, ({ debug: _debug, dryRun }) =>
	genLogger('studiocms/cli/init')(function* () {
		let debug: boolean;

		if (typeof _debug !== 'boolean') {
			debug = yield* _debug;
		} else {
			debug = _debug;
		}

		const dry = yield* dryRun;

		const context = yield* genContext;
		const { chalk } = context;

		yield* Console.log('Starting interactive CLI...');

		debug && logger.debug(`Options: ${JSON.stringify({ debug, dry }, null, 2)}`);

		debug && logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

		yield* Console.log(''); // Add a line break

		yield* intro(
			`${label('StudioCMS', StudioCMSColorwayBg, chalk.black)} Interactive CLI - initializing...`
		);

		yield* SCMS_Intro(debug).pipe(CliContext.makeProvide(context));

		// Steps
		const steps: StepFn[] = [];

		debug && logger.debug('Running Option selection...');

		const options = yield* multiselect({
			message: 'What would you like to do? (Select all that apply)',
			options: [{ value: 'env', label: 'Setup Environment File', hint: 'Create a .env file' }],
		});

		// Cancel or add steps based on options
		if (typeof options === 'symbol') {
			yield* context.pCancel(options);
		} else {
			options.includes('env') && steps.push(env);
		}

		// No steps? Exit
		if (steps.length === 0) {
			yield* log.error('No steps selected, exiting...');
			yield* context.exit(1);
		}

		debug && logger.debug('Running steps...');

		// Run steps
		for (const step of steps) {
			yield* Effect.tryPromise({
				try: () => step(context, debug, dry),
				catch: (error) =>
					new Error(
						`Step execution failed: ${error instanceof Error ? error.message : String(error)}`
					),
			});
		}

		debug && logger.debug('Running tasks...');

		// No tasks? Exit
		if (context.tasks.length === 0) {
			yield* log.error('No tasks selected, exiting...');
			yield* context.exit(0);
		}

		// Run tasks
		yield* tasks(context.tasks);

		debug && logger.debug('Running next steps...');

		// Run next steps
		yield* next(debug).pipe(CliContext.makeProvide(context));

		debug && logger.debug('Interactive CLI completed, exiting...');

		// All done, exit
		yield* context.exit(0);
	})
).pipe(Cli.Command.withDescription('Initialize the StudioCMS project after new installation.'));
