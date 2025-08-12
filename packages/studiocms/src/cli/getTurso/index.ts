import { runInteractiveCommand } from '@withstudiocms/cli-kit/utils';
import { Cli, Effect, genLogger } from '../../effect.js';

export const getTurso = Cli.Command.make('get-turso', {}, () =>
	genLogger('studiocms/cli/getTurso')(function* () {
		yield* Effect.tryPromise({
			try: () =>
				runInteractiveCommand('curl -sSfL https://get.tur.so/install.sh | bash').then(() =>
					console.log('Turso CLI install command completed.')
				),
			catch: (error) => console.error(`Failed to run Turso install: ${(error as Error).message}`),
		});
	})
).pipe(Cli.Command.withDescription('Install the Turso CLI'));
