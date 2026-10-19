import { NonZeroExitError, x } from 'tinyexec';
import type { CommandExecutor, CommandExecutorOptions } from '../definitions.js';

/**
 * Represents an error that occurs during command execution.
 */
class TinyExecError extends Error {
	stderr?: string;
	stdout?: string;
}

/**
 * Provides a command executor that uses the Tinyexec library to run shell commands.
 */
export class TinyexecCommandExecutor implements CommandExecutor {
	async execute(
		command: string,
		args?: Array<string>,
		options?: CommandExecutorOptions
	): Promise<{ stdout: string }> {
		const proc = x(command, args, {
			throwOnError: true,
			nodeOptions: {
				cwd: options?.cwd,
				env: options?.env,
				shell: options?.shell,
				stdio: options?.stdio,
			},
		});
		if (options?.input) {
			proc.process?.stdin?.end(options.input);
		}
		return await proc.then(
			(o) => o,
			(e) => {
				if (e instanceof NonZeroExitError) {
					const fullCommand = args?.length
						? `${command} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`
						: command;
					const message = `The command \`${fullCommand}\` exited with code ${e.exitCode}`;
					const newError = new TinyExecError(message, e.cause ? { cause: e.cause } : undefined);
					newError.stderr = e.output?.stderr;
					newError.stdout = e.output?.stdout;
					throw newError;
				}
				throw e;
			}
		);
	}
}
