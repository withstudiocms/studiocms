import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { intro, log, select, tasks } from '@withstudiocms/effect/clack';
import { type Kysely, sql } from '@withstudiocms/kysely/kysely';
import { Cli, Effect, genLogger } from '../../effect.js';
import { checkRequiredEnvVarsEffect } from '../utils/checkRequiredEnvVars.js';
import { type BaseContext, CliContext, genContext, parseDebug } from '../utils/context.js';
import { debug } from '../utils/debugOpt.js';
import { getCliDbClient } from '../utils/getCliDbClient.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { buildDebugLogger } from '../utils/logger.js';
import type { EffectStepFn } from '../utils/types.js';
import { createUsers } from './steps/createUsers.js';
import { modifyUsers } from './steps/modifyUsers.js';
import { next } from './steps/next.js';

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

// biome-ignore lint/suspicious/noExplicitAny: Allowed when using raw sql queries in this context
const getQuery = Effect.fn(({ db }: { db: Kysely<any> }) =>
	Effect.tryPromise(
		async () => (await db.executeQuery(sql<string>`SELECT CURRENT_TIME;`.compile(db))).rows[0]
	)
);

export enum DBEditOptions {
	create = 'create',
	modify = 'modify',
}

type SelectOptionMap = {
	[key in DBEditOptions]: EffectStepFn;
};

const SelectOptionMapper: SelectOptionMap = {
	[DBEditOptions.create]: createUsers,
	[DBEditOptions.modify]: modifyUsers,
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
					`${label('StudioCMS', StudioCMSColorwayBg, 'black')} Interactive CLI - initializing...`
				),
				checkRequiredEnvVarsEffect(['CMS_ENCRYPTION_KEY']),
			]);

			// Check DB Config and Required Env Vars
			yield* getCliDbClient(context).pipe(
				Effect.flatMap(getQuery),
				Effect.tap((ts) => debugLogger(`Database connection successful: ${ts}`))
			);

			yield* SCMS_Intro(debug).pipe(cliContext);

			// Steps
			const steps: EffectStepFn[] = [];

			// Get options for steps
			const options = yield* select({
				message: 'What would you like to do?',
				options: [
					{ value: DBEditOptions.create, label: 'Create new user' },
					{ value: DBEditOptions.modify, label: 'Modify an existing user' },
				],
			});

			if (typeof options === 'symbol') {
				return yield* context.pCancel(options);
			}

			// Map selected options to steps
			const selectedStep = SelectOptionMapper[options];
			steps.push(selectedStep);

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
