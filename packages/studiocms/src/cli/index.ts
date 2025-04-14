import { Option } from '@commander-js/extra-typings';
import { Command } from './lib/commander.js';
import pathUtil from './lib/pathUtil.js';
import { CLITitle, readJson } from './lib/utils.js';

const pkgJson = readJson<{ version: string }>(new URL('../../package.json', import.meta.url));

const { getRelPath } = pathUtil(import.meta.url);

await new Command('studiocms')
	.description('StudioCMS CLI Utility Toolkit')
	.version(pkgJson.version)
	.addHelpText('beforeAll', CLITitle)
	.showHelpAfterError('(add --help for additional information)')
	.enablePositionalOptions(true)
	.executableDir(getRelPath('cmds'))
	.helpOption('-h, --help', 'Display help for command.')
	.addOption(new Option('--color', 'Force color output')) // implemented by chalk
	.addOption(new Option('--no-color', 'Disable color output')) // implemented by chalk

	// Commands
	.command('add <plugins...>', 'Add StudioCMS plugin(s) to your project', {
		executableFile: 'add.js',
	})
	.command('crypto', 'Crypto Utilities for Security', {
		executableFile: 'crypto.js',
	})
	.command('get-turso', 'Install the Turso CLI', {
		executableFile: 'get-turso.js',
	})
	.command('init', 'Initialize the StudioCMS project after new installation.', {
		executableFile: 'init.js',
	})
	.command('users', 'Utilities for Tweaking Users in StudioCMS', {
		executableFile: 'users.js',
	})

	// Parse the command line arguments
	.parseAsync();
