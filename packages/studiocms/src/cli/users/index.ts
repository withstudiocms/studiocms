import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { type ClackError, intro, log, select, tasks } from '@withstudiocms/effect/clack';
import { Cli, Effect, genLogger } from '../../effect.js';
import { checkRequiredEnvVarsEffect } from '../utils/checkRequiredEnvVars.js';
import { type BaseContext, CliContext, genContext, parseDebug } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { buildDebugLogger } from '../utils/logger.js';
import type { EffectStepFn } from '../utils/types.js';
import { libsqlCreateUsers } from './steps/libsql/createUsers.js';
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

export enum DBOptionsType {
	libsql = 'libsql',
}

export enum DBEditOptions {
	create = 'create',
	modify = 'modify',
}

type SelectStepMap = {
	default: (context: BaseContext, val: symbol) => Effect.Effect<void, ClackError>;
} & { [key in DBEditOptions]: EffectStepFn };

const SelectToStepMap: Record<DBOptionsType, SelectStepMap> = {
	[DBOptionsType.libsql]: {
		default: Effect.fn(function* (context: BaseContext, val: symbol) {
			yield* log.error('No valid option selected, exiting...');
			return yield* context.pCancel(val);
		}),
		[DBEditOptions.create]: libsqlCreateUsers,
		[DBEditOptions.modify]: Effect.fn(function* (context, debug, dry) {}),
	},
};

const OptionsMap: {
	default: (context: BaseContext, val: symbol) => Effect.Effect<void, ClackError>;
} & {
	[key in DBOptionsType]: (
		steps: EffectStepFn[],
		context: BaseContext
	) => Effect.Effect<void, ClackError | Error>;
} = {
	default: Effect.fn(function* (context: BaseContext, val: symbol) {
		yield* log.error('No valid option selected, exiting...');
		return yield* context.pCancel(val);
	}),
	[DBOptionsType.libsql]: Effect.fn(function* (steps: EffectStepFn[], context: BaseContext) {
		const libsqlAction = yield* select({
			message: 'What would you like to do?',
			options: [
				{ value: DBEditOptions.create, label: 'Create new user' },
				{ value: DBEditOptions.modify, label: 'Modify an existing user' },
			],
		});

		switch (libsqlAction) {
			case DBEditOptions.create:
			case DBEditOptions.modify: {
				steps.push(SelectToStepMap[DBOptionsType.libsql][libsqlAction]);
				break;
			}
			default: {
				return yield* SelectToStepMap[DBOptionsType.libsql].default(context, libsqlAction);
			}
		}
	}),
};

export const usersCMD = Cli.Command.make(
	'users',
	{ debug, dryRun },
	({ debug: rawDebug, dryRun: rawDryRun }) =>
		genLogger('studiocms/cli/users')(function* () {
			const [dry, context, debug] = yield* Effect.all([
				rawDryRun,
				genContext,
				parseDebug(rawDebug),
			]);

			const debugLogger = yield* buildDebugLogger(debug);

			const cliContext = CliContext.makeProvide(context);

			yield* Effect.all([
				debugLogger(`Context: ${JSON.stringify(context, null, 2)}`),
				intro(
					`${label('StudioCMS', StudioCMSColorwayBg, context.chalk.black)} Interactive CLI - initializing...`
				),
				checkRequiredEnvVarsEffect([
					'ASTRO_DB_REMOTE_URL',
					'ASTRO_DB_APP_TOKEN',
					'CMS_ENCRYPTION_KEY',
				]),
			]);

			yield* SCMS_Intro(debug).pipe(cliContext);

			// Steps
			const steps: EffectStepFn[] = [];

			// Get options for steps
			const options = yield* select({
				message: 'What kind of Database are you using?',
				options: [{ value: DBOptionsType.libsql, label: 'libSQL Remote' }],
			});

			switch (options) {
				case DBOptionsType.libsql: {
					yield* OptionsMap[DBOptionsType.libsql](steps, context);
					break;
				}
				default:
					yield* OptionsMap.default(context, options);
					return;
			}

			// No steps? Exit
			yield* exitIfEmpty(context, steps, 'steps');

			yield* Effect.all([
				debugLogger('Running steps...'),
				Effect.forEach(steps, (step) => step(context, debug, dry)),
			]);

			// No tasks? Exit
			yield* exitIfEmpty(context, context.tasks, 'tasks');

			yield* Effect.all([debugLogger('Running tasks...'), tasks(context.tasks)]);

			yield* Effect.all([debugLogger('Running next steps...'), next(debug).pipe(cliContext)]);

			yield* Effect.all([debugLogger('Interactive CLI completed, exiting...'), context.exit(0)]);
		})
).pipe(Cli.Command.withDescription('Utilities for Tweaking Users in StudioCMS'));
