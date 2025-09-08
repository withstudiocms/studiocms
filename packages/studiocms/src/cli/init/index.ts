import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { intro, log, multiselect, tasks } from '@withstudiocms/effect/clack';
import { Cli, Console, Effect, genLogger } from '../../effect.js';
import { CliContext, genContext } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { logger } from '../utils/logger.js';
import type { EffectStepFn } from '../utils/types.js';
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

const OptionToStepMap: Record<string, EffectStepFn> = {
	env,
};

export const initCMD = Cli.Command.make('init', { debug, dryRun }, ({ debug: _debug, dryRun }) =>
	genLogger('studiocms/cli/init')(function* () {
		let debug: boolean;

		if (typeof _debug !== 'boolean') {
			debug = yield* _debug;
		} else {
			debug = _debug;
		}

		const [dry, context] = yield* Effect.all([dryRun, genContext]);

		const { chalk } = context;

		yield* Console.log('Starting interactive CLI...');

		debug && logger.debug(`Options: ${JSON.stringify({ debug, dry }, null, 2)}`);

		debug && logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

		yield* Console.log(''); // Add a line break

		yield* intro(
			`${label('StudioCMS', StudioCMSColorwayBg, chalk.black)} Interactive CLI - initializing...`
		);

		yield* SCMS_Intro(debug).pipe(CliContext.makeProvide(context));

		// Steps to run
		const steps: EffectStepFn[] = [];

		debug && logger.debug('Running Option selection...');

		const options = yield* multiselect({
			message: 'What would you like to do? (Select all that apply)',
			options: [{ value: 'env', label: 'Setup Environment File', hint: 'Create a .env file' }],
		});

		// Cancel or add steps based on options
		if (typeof options === 'symbol') {
			yield* context.pCancel(options);
		} else {
			options.forEach((opt) => {
				const step = OptionToStepMap[opt];
				if (step) {
					steps.push(step);
				} else {
					debug && logger.debug(`No step found for option: ${opt}`);
				}
			});
		}

		// No steps? Exit
		if (steps.length === 0) {
			yield* log.error('No steps selected, exiting...');
			yield* context.exit(1);
		}

		debug && logger.debug('Running steps...');

		yield* Effect.forEach(steps, (step) => step(context, debug, dry));

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
