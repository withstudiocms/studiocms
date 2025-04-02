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
function exitIfEmpty(ctx: Context, items: any[], itemType: string) {
	if (items.length === 0) {
		ctx.p.log.error(`No ${itemType} selected, exiting...`);
		ctx.exit(0);
	}
}

type ContextStep = (ctx: Context) => Promise<void>;

export async function initCMD(this: instanceCommand) {
	// Parse options
	const opts = this.opts();

	// Get context
	const ctx = await getContext(opts);

	ctx.logger.log('Starting interactive CLI...');

	ctx.debug && ctx.logger.debug(`Options: ${JSON.stringify(opts, null, 2)}`);

	ctx.debug && ctx.logger.debug(`Context: ${JSON.stringify(ctx, null, 2)}`);

	console.log(''); // Add a line break

	ctx.debug && ctx.logger.debug('Running interactive CLI Steps...');

	ctx.p.intro(
		`${label('StudioCMS', StudioCMSColorwayBg, color.black)} Interactive CLI - initializing...`
	);

	// Run intro
	await intro(ctx);

	// Steps
	const steps: ContextStep[] = [];

	// Get options for steps
	const options = await ctx.p.select({
		message: 'What kind of Database are you using?',
		options: [
			{ value: 'libsql', label: 'libSQL Remote' },
			// TODO: Add support for other database types (e.g., PostgreSQL, MySQL)
		],
	});

	switch (options) {
		case 'libsql': {
			const libsqlAction = await ctx.p.select({
				message: 'What would you like to do?',
				options: [
					{ value: 'modify', label: 'Modify an existing user' },
					{ value: 'create', label: 'Create new user' },
				],
			});

			if (typeof libsqlAction === 'symbol') {
				ctx.pCancel(libsqlAction);
				ctx.exit(0);
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
			ctx.pCancel(options);
	}

	ctx.debug && ctx.logger.debug('Running steps...');

	// No steps? Exit
	exitIfEmpty(ctx, steps, 'steps');

	// Run steps
	for (const step of steps) {
		await step(ctx);
	}

	ctx.debug && ctx.logger.debug('Running tasks...');

	// No tasks? Exit
	exitIfEmpty(ctx, ctx.tasks, 'tasks');

	// Run tasks
	await ctx.p.tasks(ctx.tasks);

	ctx.debug && ctx.logger.debug('Running next steps...');

	// Run next steps
	await next(ctx);

	ctx.debug && ctx.logger.debug('Interactive CLI completed, exiting...');

	// All done, exit
	ctx.exit(0);
}
