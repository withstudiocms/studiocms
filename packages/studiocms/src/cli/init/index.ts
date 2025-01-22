import color from 'chalk';
import type { instanceCommand } from '../lib/commander.js';
import { getContext } from '../lib/context.js';
import { StudioCMSColorwayBg, label } from '../lib/utils.js';
import { intro } from '../shared/intro.js';
import { env } from './steps/envBuilder.js';
import { next } from './steps/nextSteps.js';

export { getContext };

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
	const steps = [];

	ctx.debug && ctx.logger.debug('Running Option selection...');

	// Get options for steps
	const options = await ctx.p.multiselect({
		message: 'What would you like to do? (Select all that apply)',
		options: [{ value: 'env', label: 'Setup Environment File', hint: 'Create a .env file' }],
	});

	// Cancel or add steps based on options
	if (typeof options === 'symbol') {
		ctx.pCancel(options);
	} else {
		options.includes('env') && steps.push(env);
	}

	ctx.debug && ctx.logger.debug('Running steps...');

	// No steps? Exit
	if (steps.length === 0) {
		ctx.p.log.error('No steps selected, exiting...');
		ctx.exit(0);
	}

	// Run steps
	for (const step of steps) {
		await step(ctx);
	}

	ctx.debug && ctx.logger.debug('Running tasks...');

	// No tasks? Exit
	if (ctx.tasks.length === 0) {
		ctx.p.log.error('No tasks selected, exiting...');
		ctx.exit(0);
	}

	// Run tasks
	await ctx.p.tasks(ctx.tasks);

	ctx.debug && ctx.logger.debug('Running next steps...');

	// Run next steps
	await next(ctx);

	ctx.debug && ctx.logger.debug('Interactive CLI completed, exiting...');

	// All done, exit
	ctx.exit(0);
}
