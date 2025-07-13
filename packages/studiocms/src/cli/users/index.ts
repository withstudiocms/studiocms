import { Command, Options } from '@effect/cli';
import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Console, Effect, genLogger } from '../../effect.js';
import { type BaseContext, CliContext, genContext } from '../utils/context.js';
import { intro } from '../utils/intro.js';
import { logger } from '../utils/logger.js';
import type { StepFn } from '../utils/types.js';
import { libsqlCreateUsers } from './steps/libsqlCreateUsers.js';
import { libsqlModifyUsers } from './steps/libsqlModifyUsers.js';
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function exitIfEmpty(context: BaseContext, items: any[], itemType: string) {
	if (items.length === 0) {
		context.prompts.log.error(`No ${itemType} selected, exiting...`);
		context.exit(0);
	}
}

export const usersCMD = Command.make('users', { debug, dryRun }, ({ debug: _debug, dryRun }) =>
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
				options: [{ value: 'libsql', label: 'libSQL Remote' }],
			})
		);

		switch (options) {
			case 'libsql': {
				const libsqlAction = yield* Effect.tryPromise(() =>
					prompts.select({
						message: 'What would you like to do?',
						options: [
							{ value: 'modify', label: 'Modify an existing user' },
							{ value: 'create', label: 'Create new user' },
						],
					})
				);

				if (typeof libsqlAction === 'symbol') {
					context.pCancel(libsqlAction);
					context.exit(0);
				}

				switch (libsqlAction) {
					case 'create': {
						steps.push(libsqlCreateUsers);
						break;
					}
					case 'modify': {
						steps.push(libsqlModifyUsers);
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
			yield* Effect.tryPromise(() => step(context, debug, dry));
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
).pipe(Command.withDescription('Utilities for Tweaking Users in StudioCMS'));
