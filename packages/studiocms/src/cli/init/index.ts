import { Command, Options } from '@effect/cli';
import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Console, Effect, genLogger } from '../../effect.js';
import { CliContext, genContext } from '../utils/context.js';
import { intro } from '../utils/intro.js';
import { logger } from '../utils/logger.js';
import type { StepFn } from '../utils/types.js';
import { env } from './steps/env.js';
import { next } from './steps/next.js';

export const debug = Options.boolean('debug').pipe(
	Options.optional,
	Options.withDefault(false),
	Options.withDescription('Enable debug mode')
);

export const dryRun = Options.boolean('dry-run').pipe(
	Options.optional,
	Options.withAlias('d'),
	Options.withDescription('Dry run mode')
);

export const initCMD = Command.make('init', { debug, dryRun }, ({ debug: _debug, dryRun }) =>
	genLogger('studiocms/cli/init')(function* () {
		let debug: boolean;

		if (typeof _debug !== 'boolean') {
			debug = yield* _debug;
		} else {
			debug = _debug;
		}

		const dry = yield* dryRun;

		const context = yield* genContext;
		const { prompts, chalk } = context;

		yield* Console.log('Starting interactive CLI...');

		debug && logger.debug(`Options: ${JSON.stringify({ debug, dry }, null, 2)}`);

		debug && logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

		yield* Console.log(''); // Add a line break

		prompts.intro(
			`${label('StudioCMS', StudioCMSColorwayBg, chalk.black)} Interactive CLI - initializing...`
		);

		yield* intro(debug).pipe(CliContext.makeProvide(context));

		// Steps
		const steps: StepFn[] = [];

		debug && logger.debug('Running Option selection...');

		const options = yield* Effect.tryPromise(() =>
			prompts.multiselect({
				message: 'What would you like to do? (Select all that apply)',
				options: [{ value: 'env', label: 'Setup Environment File', hint: 'Create a .env file' }],
			})
		);

		// Cancel or add steps based on options
		if (typeof options === 'symbol') {
			context.pCancel(options);
		} else {
			options.includes('env') && steps.push(env);
		}

		// No steps? Exit
		if (steps.length === 0) {
			prompts.log.error('No steps selected, exiting...');
			context.exit(1);
		}

		debug && logger.debug('Running steps...');

		// Run steps
		for (const step of steps) {
			yield* Effect.tryPromise({
				try: () => step(context, debug, dry),
				catch: (error) => {
					prompts.log.error(
						`Step execution failed: ${error instanceof Error ? error.message : String(error)}`
					);
					return new Error(
						`Step execution failed: ${error instanceof Error ? error.message : String(error)}`
					);
				},
			});
		}

		debug && logger.debug('Running tasks...');

		// No tasks? Exit
		if (context.tasks.length === 0) {
			prompts.log.error('No tasks selected, exiting...');
			context.exit(0);
		}

		// Run tasks
		yield* Effect.tryPromise(() => prompts.tasks(context.tasks));

		debug && logger.debug('Running next steps...');

		// Run next steps
		yield* next(debug).pipe(CliContext.makeProvide(context));

		debug && logger.debug('Interactive CLI completed, exiting...');

		// All done, exit
		context.exit(0);
	})
).pipe(Command.withDescription('Initialize the StudioCMS project after new installation.'));
