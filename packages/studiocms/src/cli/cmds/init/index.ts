import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import type { instanceCommand } from '@withstudiocms/cli-kit/commander';
import { label } from '@withstudiocms/cli-kit/messages';
import { getContext } from '../../lib/context.js';
import { intro } from '../../shared/intro.js';
import { env } from './steps/envBuilder.js';
import { next } from './steps/nextSteps.js';

export { getContext };

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
		`${label('StudioCMS', StudioCMSColorwayBg, context.c.black)} Interactive CLI - initializing...`
	);

	// Run intro
	await intro(context);

	// Steps
	const steps = [];

	context.debug && context.logger.debug('Running Option selection...');

	// Get options for steps
	const options = await context.p.multiselect({
		message: 'What would you like to do? (Select all that apply)',
		options: [{ value: 'env', label: 'Setup Environment File', hint: 'Create a .env file' }],
	});

	// Cancel or add steps based on options
	if (typeof options === 'symbol') {
		context.pCancel(options);
	} else {
		options.includes('env') && steps.push(env);
	}

	context.debug && context.logger.debug('Running steps...');

	// No steps? Exit
	if (steps.length === 0) {
		context.p.log.error('No steps selected, exiting...');
		context.exit(0);
	}

	// Run steps
	for (const step of steps) {
		await step(context);
	}

	context.debug && context.logger.debug('Running tasks...');

	// No tasks? Exit
	if (context.tasks.length === 0) {
		context.p.log.error('No tasks selected, exiting...');
		context.exit(0);
	}

	// Run tasks
	await context.p.tasks(context.tasks);

	context.debug && context.logger.debug('Running next steps...');

	// Run next steps
	await next(context);

	context.debug && context.logger.debug('Interactive CLI completed, exiting...');

	// All done, exit
	context.exit(0);
}
