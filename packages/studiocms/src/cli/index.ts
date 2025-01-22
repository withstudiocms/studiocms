import { Option } from '@commander-js/extra-typings';
import { initCMD } from './init/index.js';
import { Command } from './lib/commander.js';
import { runInteractiveCommand } from './lib/runExternal.js';
import { CLITitle, logger, readJson } from './lib/utils.js';

const pkgJson = readJson<{ version: string }>(new URL('../../package.json', import.meta.url));

export async function main() {
	logger.log('Starting StudioCMS CLI Utility Toolkit...');

	const Program = new Command('studiocms')
		.description('StudioCMS CLI Utility Toolkit')
		.version(pkgJson.version)
		.addHelpText('beforeAll', CLITitle)
		.showHelpAfterError('(add --help for additional information)')
		.enablePositionalOptions(true)
		.helpOption('-h, --help', 'Display help for command.')
		.addOption(new Option('--color', 'Force color output')) // implemented by chalk
		.addOption(new Option('--no-color', 'Disable color output')) // implemented by chalk
		.action(() => Program.help()); // Enable help command;

	const Init = new Command('init')
		.description('Initialize the StudioCMS project after new installation.')
		.summary('Initialize StudioCMS Project')
		.option('-d, --dry-run', 'Dry run mode.')
		.option('--skip-banners', 'Skip all banners.')
		.addOption(new Option('--debug', 'Enable debug mode.').hideHelp(true))
		.action(initCMD);

	const Turso = new Command('getTurso')
		.description('Turso CLI Utilities')
		.summary('Turso CLI Utilities')
		.action(async () => {
			try {
				await runInteractiveCommand('curl -sSfL https://get.tur.so/install.sh | bash');
				console.log('Command completed successfully.');
			} catch (error) {
				console.error(`Failed to run Turso install: ${(error as Error).message}`);
			}
		});

	Program.addCommand(Init);
	Program.addCommand(Turso);

	await Program.parseAsync();
}
