import { supportsColor } from '@withstudiocms/cli-kit/colors';
import { date } from '@withstudiocms/cli-kit/messages';
import chalk from 'chalk';

let stdout = process.stdout;

/** @internal Used to mock `process.stdout.write` for testing purposes */
export function setStdout(writable: typeof process.stdout) {
	stdout = writable;
}

const send = (message: string) => stdout.write(`${message}\n`);

export const logger = {
	debug: (message: string) => {
		if (!supportsColor) {
			send(`DEBUG [${date}]: ${message}`);
			return;
		}
		send(`${chalk.blue.bold(`DEBUG [${date}]:`)} ${message}`);
	},
};
