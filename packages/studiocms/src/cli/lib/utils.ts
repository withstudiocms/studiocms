import type { outro as _outro } from '@clack/prompts';
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
	log: (message: string) => {
		if (!supportsColor) {
			send(`[${date}]: ${message}`);
			return;
		}
		send(`${chalk.blue.bold(`[${date}]:`)} ${message}`);
	},
	debug: (message: string) => {
		if (!supportsColor) {
			send(`DEBUG [${date}]: ${message}`);
			return;
		}
		send(`${chalk.blue.bold(`DEBUG [${date}]:`)} ${message}`);
	},
	error: (message: string) => {
		if (!supportsColor) {
			send(`ERROR [${date}]: ${message}`);
			return;
		}
		send(`${chalk.red.bold(`ERROR [${date}]:`)} ${chalk.red(message)}`);
	},
	warn: (message: string) => {
		if (!supportsColor) {
			send(`WARN [${date}]: ${message}`);
			return;
		}
		send(`${chalk.yellow.bold(`WARN [${date}]:`)} ${chalk.yellow(message)}`);
	},
};
