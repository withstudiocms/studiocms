import { runInteractiveCommand } from '@withstudiocms/cli-kit/utils';
import { Cli, Effect } from '../../effect.js';
import { StudioCMSCliError } from '../utils/errors.js';

const shell = Cli.Args.text({ name: 'shell' }).pipe(
	Cli.Args.optional,
	Cli.Args.withDescription(
		'The shell to use for executing the install command (e.g., bash, zsh) (default: bash)'
	)
);

export const getTurso = Cli.Command.make('get-turso', { shell }, ({ shell: rawShell }) =>
	Effect.gen(function* () {
		let shell: string | undefined;

		if (typeof rawShell !== 'string' && rawShell !== undefined) {
			shell = yield* rawShell;
		}

		const command = `curl -sSfL https://get.tur.so/install.sh | ${shell ? shell : 'bash'}`;

		return yield* Effect.tryPromise({
			try: () =>
				runInteractiveCommand(command).then(() =>
					console.log('Turso CLI install command completed.')
				),
			catch: (error) =>
				new StudioCMSCliError({
					message: `Failed to install Turso CLI: ${String(error)}`,
					cause: error,
				}),
		});
	})
).pipe(Cli.Command.withDescription('Install the Turso CLI'));
