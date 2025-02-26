import { type SpawnOptions, exec, spawn, spawnSync } from 'node:child_process';

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

/**
 * Run a shell command.
 * @param command The full shell command to execute.
 * @returns A Promise that resolves with the command's output or rejects with an error.
 */
export function runShellCommand(command: string): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`Error: ${error.message}\n${stderr}`));
				return;
			}
			resolve(stdout);
		});
	});
}

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
