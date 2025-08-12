import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Cli, Console, Effect, genLogger } from '../../effect.js';
import { type BaseContext, CliContext, genContext } from '../utils/context.js';
import { intro } from '../utils/intro.js';
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
function exitIfEmpty(context: BaseContext, items: any[], itemType: string) {
	if (items.length === 0) {
		context.prompts.log.error(`No ${itemType} selected, exiting...`);
		context.exit(0);
	}
}

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
		const { chalk, prompts } = context;

		yield* Console.log('Starting interactive CLI...');

		debug && logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

		console.log(''); // Add a line break

		prompts.intro(
			`${label('StudioCMS', StudioCMSColorwayBg, chalk.black)} Interactive CLI - initializing...`
		);

		yield* intro(debug).pipe(CliContext.makeProvide(context));

		// Steps
		const steps: StepFn[] = [];

		// Get options for steps
		const options = yield* Effect.tryPromise(() =>
			prompts.select({
				message: 'What kind of Database are you using?',
				options: [{ value: DBOptionsType.libsql, label: 'libSQL Remote' }],
			})
		);

		switch (options) {
			case DBOptionsType.libsql: {
				const libsqlAction = yield* Effect.tryPromise(() =>
					prompts.select({
						message: 'What would you like to do?',
						options: [
							{ value: DBEditOptions.create, label: 'Create new user' },
							{ value: DBEditOptions.modify, label: 'Modify an existing user' },
						],
					})
				);

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
						context.pCancel(libsqlAction);
						context.exit(0);
						break;
					}
				}
				break;
			}
			default:
				context.pCancel(options);
		}

		// No steps? Exit
		exitIfEmpty(context, steps, 'steps');

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

		// No tasks? Exit
		exitIfEmpty(context, context.tasks, 'tasks');

		debug && logger.debug('Running tasks...');

		// Run tasks
		yield* Effect.tryPromise(() => prompts.tasks(context.tasks));

		debug && logger.debug('Running next steps...');

		// Run next steps
		yield* next(debug).pipe(CliContext.makeProvide(context));

		debug && logger.debug('Interactive CLI completed, exiting...');

		// All done, exit
		context.exit(0);
	})
).pipe(Cli.Command.withDescription('Utilities for Tweaking Users in StudioCMS'));
