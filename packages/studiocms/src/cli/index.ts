import { Option } from '@commander-js/extra-typings';
import pkgJson from '../../package.json' assert { type: 'json' };
import { Command } from './commander.js';
import { CLITitle, logger } from './utils.js';

export async function main() {
	logger.log('Starting StudioCMS CLI Utility Toolkit...');

	const program = new Command('studiocms')
		.description('StudioCMS CLI Utility Toolkit')
		.version(pkgJson.version)
		.addHelpText('beforeAll', CLITitle)
		.showHelpAfterError('(add --help for additional information)')
		.enablePositionalOptions(true)
		.helpOption('-h, --help', 'Display help for command.')
		.addOption(new Option('--color', 'Force color output')) // implemented by chalk
		.addOption(new Option('--no-color', 'Disable color output')) // implemented by chalk
		.helpCommand('help [cmd]', 'Show help for command'); // Enable help command;

	// Add Commands
	program.command('help-default', { isDefault: true, hidden: true }).action(() => program.help());

	await program.parseAsync();
}
