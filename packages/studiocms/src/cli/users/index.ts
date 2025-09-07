import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { intro, log, select, tasks } from '@withstudiocms/effect/clack';
import { Cli, Console, Effect, genLogger } from '../../effect.js';
import { checkRequiredEnvVars } from '../utils/checkRequiredEnvVars.js';
import { type BaseContext, CliContext, genContext } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { logger } from '../utils/logger.js';
import type { StepFn } from '../utils/types.js';
import { libsqlCreateUsers } from './steps/libsqlCreateUsers.js';
import { libsqlModifyUsers } from './steps/libsqlModifyUsers.js';
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

export const usersCMD = Cli.Command.make('users', { debug, dryRun }, ({ debug: _debug, dryRun }) =>
	genLogger('studiocms/cli/users')(function* () {
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

		debug && logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

		console.log(''); // Add a line break

		yield* intro(
			`${label('StudioCMS', StudioCMSColorwayBg, chalk.black)} Interactive CLI - initializing...`
		);

		yield* SCMS_Intro(debug).pipe(CliContext.makeProvide(context));

		yield* Effect.tryPromise(() =>
			checkRequiredEnvVars(['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY'])
		);

		// Steps
		const steps: StepFn[] = [];

		// Get options for steps
		const options = yield* select({
			message: 'What kind of Database are you using?',
			options: [{ value: DBOptionsType.libsql, label: 'libSQL Remote' }],
		});

		switch (options) {
			case DBOptionsType.libsql: {
				const libsqlAction = yield* select({
					message: 'What would you like to do?',
					options: [
						{ value: DBEditOptions.create, label: 'Create new user' },
						{ value: DBEditOptions.modify, label: 'Modify an existing user' },
					],
				});

				switch (libsqlAction) {
					case DBEditOptions.create: {
						steps.push(libsqlCreateUsers);
						break;
					}
					case DBEditOptions.modify: {
						steps.push(libsqlModifyUsers);
						break;
					}
					default: {
						yield* context.pCancel(libsqlAction);
						yield* context.exit(0);
						break;
					}
				}
				break;
			}
			default:
				yield* context.pCancel(options);
		}

		// No steps? Exit
		yield* exitIfEmpty(context, steps, 'steps');

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

		// No tasks? Exit
		yield* exitIfEmpty(context, context.tasks, 'tasks');

		debug && logger.debug('Running tasks...');

		// Run tasks
		yield* tasks(context.tasks);

		debug && logger.debug('Running next steps...');

		// Run next steps
		yield* next(debug).pipe(CliContext.makeProvide(context));

		debug && logger.debug('Interactive CLI completed, exiting...');

		// All done, exit
		yield* context.exit(0);
	})
).pipe(Cli.Command.withDescription('Utilities for Tweaking Users in StudioCMS'));
