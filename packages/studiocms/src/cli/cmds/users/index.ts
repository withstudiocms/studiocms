import color from 'chalk';
import type { instanceCommand } from '../../lib/commander.js';
import { type Context, getContext } from '../../lib/context.js';
import { StudioCMSColorwayBg, label } from '../../lib/utils.js';
import { intro } from '../../shared/intro.js';
import { libsqlCreateUsers } from './steps/libsql/createUsers.js';
import { libsqlModifyUsers } from './steps/libsql/modifyUsers.js';
import { next } from './steps/nextSteps.js';

export { getContext };

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function exitIfEmpty(context: Context, items: any[], itemType: string) {
	if (items.length === 0) {
		context.p.log.error(`No ${itemType} selected, exiting...`);
		context.exit(0);
	}
}

type ContextStep = (context: Context) => Promise<void>;

export async function initCMD(this: instanceCommand) {
	// Parse options
	const opts = this.opts();

	// Get context
	const context = await getContext(opts);

	context.logger.log('Starting interactive CLI...');

	context.debug && context.logger.debug(`Options: ${JSON.stringify(opts, null, 2)}`);

	context.debug && context.logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

	console.log(''); // Add a line break

	context.debug && context.logger.debug('Running interactive CLI Steps...');

	context.p.intro(
		`${label('StudioCMS', StudioCMSColorwayBg, color.black)} Interactive CLI - initializing...`
	);

	// Run intro
	await intro(context);

	// Steps
	const steps: ContextStep[] = [];

	// Get options for steps
	const options = await context.p.select({
		message: 'What kind of Database are you using?',
		options: [
			{ value: 'libsql', label: 'libSQL Remote' },
			// TODO: Add support for other database types (e.g., PostgreSQL, MySQL)
		],
	});

	switch (options) {
		case 'libsql': {
			const libsqlAction = await context.p.select({
				message: 'What would you like to do?',
				options: [
					{ value: 'modify', label: 'Modify an existing user' },
					{ value: 'create', label: 'Create new user' },
				],
			});

			if (typeof libsqlAction === 'symbol') {
				context.pCancel(libsqlAction);
				context.exit(0);
			}

			switch (libsqlAction) {
				case 'modify': {
					steps.push(libsqlModifyUsers);
					break;
				}
				case 'create': {
					steps.push(libsqlCreateUsers);
					break;
				}
			}
			break;
		}
		default:
			context.pCancel(options);
	}

	context.debug && context.logger.debug('Running steps...');

	// No steps? Exit
	exitIfEmpty(context, steps, 'steps');

	// Run steps
	for (const step of steps) {
		await step(context);
	}

	context.debug && context.logger.debug('Running tasks...');

	// No tasks? Exit
	exitIfEmpty(context, context.tasks, 'tasks');

	// Run tasks
	await context.p.tasks(context.tasks);

	context.debug && context.logger.debug('Running next steps...');

	// Run next steps
	await next(context);

	context.debug && context.logger.debug('Interactive CLI completed, exiting...');

	// All done, exit
	context.exit(0);
}
