import { Command, Option } from '@withstudiocms/cli-kit/commander';
import { initCMD } from './users/index.js';

await new Command('users')
	.description('Utilities for Tweaking Users in StudioCMS')
	.summary('Utilities for Tweaking Users in StudioCMS')
	.addOption(new Option('--debug', 'Enable debug mode.').hideHelp(true))
	.action(initCMD)
	.parseAsync();
