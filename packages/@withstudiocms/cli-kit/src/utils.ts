/**
 * @module @withstudiocms/cli-kit/utils
 *
 * Provides utility functions for executing shell commands, checking command existence,
 * and handling file paths. Includes functions for running commands both interactively
 * and non-interactively, as well as utilities for resolving file paths and checking
 * file existence.
 */

import {
	exec as _exec,
	type ChildProcess,
	type SpawnOptions,
	type StdioOptions,
	spawn,
	spawnSync,
} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { text as textFromStream } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';
import { NonZeroExitError, type Options, x } from 'tinyexec';

interface ExecError extends Error {
	stderr?: string;
	stdout?: string;
}

export interface ExecaOptions {
	cwd?: string | URL;
	stdio?: StdioOptions;
	timeout?: number;
}

export interface Output {
	stdout: string;
	stderr: string;
	exitCode: number;
}

const text = (stream: NodeJS.ReadableStream | Readable | null) =>
	stream ? textFromStream(stream).then((t) => t.trimEnd()) : '';

/**
 * Executes a shell command with the specified flags and options.
 *
 * @param command - The command to execute (e.g., 'npm', 'git', 'node')
 * @param flags - An array of command-line flags/arguments to pass to the command
 * @param opts - Optional execution options including cwd, stdio, and timeout settings
 *
 * @returns A promise that resolves to an Output object containing stdout, stderr, and exitCode
 *
 * @throws An object with stdout, stderr, and exitCode properties if the process fails to spawn
 * @throws An Error with message "Timeout" if the command exceeds the specified timeout
 * @throws An Error with the stderr content if the command exits with a non-zero exit code
 *
 * @example
 * ```typescript
 * const result = await shell('npm', ['install'], { cwd: '/path/to/project' });
 * console.log(result.stdout);
 * ```
 */
export async function shell(
	command: string,
	flags: string[],
	opts: ExecaOptions = {}
): Promise<Output> {
	let child: ChildProcess;
	let stdout = '';
	let stderr = '';
	try {
		child = spawn(command, flags, {
			cwd: opts.cwd,
			shell: true,
			stdio: opts.stdio,
			timeout: opts.timeout,
		});
		const done = new Promise((resolve) => child.on('close', resolve));
		[stdout, stderr] = await Promise.all([text(child.stdout), text(child.stderr)]);
		await done;
		/* v8 ignore start */
	} catch {
		throw { stdout, stderr, exitCode: 1 };
	}
	/* v8 ignore stop */
	const { exitCode } = child;
	if (exitCode === null) {
		throw new Error('Timeout');
	}
	if (exitCode !== 0) {
		throw new Error(stderr);
	}
	return { stdout, stderr, exitCode };
}

/* v8 ignore start */
/**
 * Improve tinyexec error logging and set `throwOnError` to `true` by default
 */
export function exec(command: string, args?: string[], options?: Partial<Options>) {
	return x(command, args, {
		throwOnError: true,
		...options,
	}).then(
		(o) => o,
		(e) => {
			if (e instanceof NonZeroExitError) {
				const fullCommand = args?.length
					? `${command} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`
					: command;
				const message = `The command \`${fullCommand}\` exited with code ${e.exitCode}`;
				const newError = new Error(message, e.cause ? { cause: e.cause } : undefined);
				(newError as ExecError).stderr = e.output?.stderr;
				(newError as ExecError).stdout = e.output?.stdout;
				throw newError;
			}
			throw e;
		}
	);
}
/* v8 ignore stop */

/**
 * Check if a command exists on the system.
 * @param command The command to check.
 * @returns A boolean indicating if the command exists.
 */
export function commandExists(command: string): boolean {
	const result = spawnSync(command, ['--version'], {
		stdio: 'ignore',
		shell: true,
	});
	return result.status === 0;
}

// // Example usage
// const command = 'turso';

// if (commandExists(command)) {
//   console.log(`${command} exists on the system.`);
// } else {
//   console.log(`${command} does not exist on the system.`);
// }

/* v8 ignore start */
/**
 * Run a shell command.
 * @param command The full shell command to execute.
 * @returns A Promise that resolves with the command's output or rejects with an error.
 */
export function runShellCommand(command: string): Promise<string> {
	return new Promise((resolve, reject) => {
		_exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`Error: ${error.message}\n${stderr}`));
				return;
			}
			resolve(stdout);
		});
	});
}
/* v8 ignore stop */

// // Example usage
// (async () => {
//     try {
//       const output = await runShellCommand('curl -sSfL https://get.tur.so/install.sh | bash');
//       console.log(`Command output: ${output}`);
//     } catch (error) {
//       console.error(`Failed to run command: ${(error as Error).message}`);
//     }
//   })();

/**
 * Run a shell command interactively.
 * @param command The shell command to execute.
 * @param options Optional spawn options.
 * @returns A Promise that resolves when the command completes or rejects on error.
 */
export function runInteractiveCommand(
	command: string,
	options: SpawnOptions = { shell: true, stdio: 'inherit' }
): Promise<void> {
	return new Promise((resolve, reject) => {
		const process = spawn(command, [], options);

		process.on('close', (code: number) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Command exited with code ${code}`));
			}
		});

		process.on('error', (error) => {
			reject(error);
		});
	});
}

// // Example usage
// (async () => {
// 	try {
// 		await runInteractiveCommand('curl -sSfL https://get.tur.so/install.sh | bash');
// 		console.log('Command completed successfully.');
// 	} catch (error) {
// 		console.error(`Failed to run command: ${(error as Error).message}`);
// 	}
// })();

/**
 * Resolves the root directory path from a given current working directory.
 *
 * @param cwd - The current working directory as a string path or URL. If not provided, defaults to process.cwd()
 * @returns The resolved absolute path to the root directory
 *
 * @example
 * ```ts
 * // Using a string path
 * const root = resolveRoot('/home/user/project');
 *
 * // Using a URL
 * const root = resolveRoot(new URL('file:///home/user/project'));
 *
 * // Using default (process.cwd())
 * const root = resolveRoot();
 * ```
 */
export function resolveRoot(cwd?: string | URL): string {
	let localCwd = cwd;
	if (localCwd instanceof URL) {
		localCwd = fileURLToPath(localCwd);
	}
	return localCwd ? path.resolve(localCwd) : process.cwd();
}

/**
 * Checks if a file or directory exists at the given path.
 *
 * @param path - The file system path to check. Can be a URL, string, or undefined.
 * @returns `true` if the path exists and is accessible, `false` otherwise.
 *
 * @example
 * ```typescript
 * exists('/path/to/file.txt') // true if file exists
 * exists(new URL('file:///path/to/file.txt')) // true if file exists
 * exists(undefined) // false
 * ```
 */
export function exists(path: URL | string | undefined) {
	if (!path) return false;
	try {
		fs.statSync(path);
		return true;
	} catch {
		return false;
	}
}

const isWindows = process?.platform === 'win32';

function slash(path: string) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

/**
 * Converts a file system path to a file URL.
 *
 * This function handles platform-specific path formatting, ensuring proper
 * file URL creation for both Windows and Unix-based systems.
 *
 * @param path - The file system path to convert to a URL
 * @returns A URL object representing the file path with the `file://` protocol
 *
 * @example
 * ```typescript
 * // On Windows
 * pathToFileURL('C:\\Users\\file.txt')
 * // Returns: URL { href: 'file:///C:/Users/file.txt' }
 *
 * // On Unix
 * pathToFileURL('/home/user/file.txt')
 * // Returns: URL { href: 'file:///home/user/file.txt' }
 * ```
 */
export function pathToFileURL(path: string): URL {
	if (isWindows) {
		let slashed = slash(path);
		// Windows like C:/foo/bar
		if (!slashed.startsWith('/')) {
			slashed = `/${slashed}`;
		}
		return new URL(`file://${slashed}`);
	}

	// Unix is easy
	return new URL(`file://${path}`);
}
