import { Command } from '../lib/commander.js';
import { runInteractiveCommand } from '../lib/runExternal.js';

await new Command('getTurso')
	.description('Turso CLI Utilities')
	.summary('Turso CLI Utilities')
	.action(async () => {
		try {
			await runInteractiveCommand('curl -sSfL https://get.tur.so/install.sh | bash');
			console.log('Command completed successfully.');
		} catch (error) {
			console.error(`Failed to run Turso install: ${(error as Error).message}`);
		}
	})
	.parseAsync();
