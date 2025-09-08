import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { intro, log, multiselect, tasks } from '@withstudiocms/effect/clack';
import { Cli, Effect, genLogger } from '../../effect.js';
import { type BaseContext, CliContext, genContext, parseDebug } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { buildDebugLogger } from '../utils/logger.js';
import { appendOptionsToSteps, type EffectStepFn, type StepMap } from '../utils/types.js';
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

// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
const exitIfEmpty = Effect.fn(function* (context: BaseContext, items: any[], itemType: string) {
	if (items.length === 0) {
		yield* log.error(`No ${itemType} selected, exiting...`);
		yield* context.exit(0);
	}
});

const OptionToStepMap: StepMap = {
	env,
};

export const initCMD = Cli.Command.make(
	'init',
	{ debug, dryRun },
	({ debug: rawDebug, dryRun: rawDryRun }) =>
		genLogger('studiocms/cli/init')(function* () {
			const [dry, context, debug] = yield* Effect.all([
				rawDryRun,
				genContext,
				parseDebug(rawDebug),
			]);

			const debugLogger = yield* buildDebugLogger(debug);

			const cliContext = CliContext.makeProvide(context);

			yield* Effect.all([
				debugLogger('Starting interactive CLI...'),
				debugLogger(`Options: ${JSON.stringify({ debug, dry }, null, 2)}`),
				debugLogger(`Context: ${JSON.stringify(context, null, 2)}`),
				intro(
					`${label('StudioCMS', StudioCMSColorwayBg, context.chalk.black)} Interactive CLI - initializing...`
				),
			]);

			yield* SCMS_Intro(debug).pipe(cliContext);

			// Steps to run
			const steps: EffectStepFn[] = [];

			const [_dropOptionLog, options] = yield* Effect.all([
				debugLogger('Running Option selection...'),
				multiselect({
					message: 'What would you like to do? (Select all that apply)',
					options: [{ value: 'env', label: 'Setup Environment File', hint: 'Create a .env file' }],
				}),
			]);

			// Cancel or add steps based on options
			if (typeof options === 'symbol') {
				return yield* context.pCancel(options);
			}

			appendOptionsToSteps(options, steps, OptionToStepMap);

			// No steps? Exit
			yield* exitIfEmpty(context, steps, 'steps');

			yield* Effect.all([
				debugLogger('Running steps...'),
				Effect.forEach(steps, (step) => step(context, debug, dry)),
			]);

			// No tasks? Exit
			yield* exitIfEmpty(context, context.tasks, 'tasks');

			yield* Effect.all([
				debugLogger(`Tasks to run: ${context.tasks.length}`),
				debugLogger('Running tasks...'),
				tasks(context.tasks),
			]);

			yield* Effect.all([
				debugLogger('Tasks complete, running next steps...'),
				next(debug).pipe(cliContext),
			]);

			yield* Effect.all([debugLogger('Interactive CLI completed, exiting...'), context.exit(0)]);
		})
).pipe(Cli.Command.withDescription('Initialize the StudioCMS project after new installation.'));
