import { Command, Option } from '@withstudiocms/cli-kit/commander';
import { initCMD } from './init/index.js';

await new Command('init')
	.description('Initialize the StudioCMS project after new installation.')
	.summary('Initialize StudioCMS Project')
	.option('-d, --dry-run', 'Dry run mode.')
	.option('--skip-banners', 'Skip all banners.')
	.addOption(new Option('--debug', 'Enable debug mode.').hideHelp(true))
	.action(initCMD)
	.parseAsync();
