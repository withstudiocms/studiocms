import { styleText } from 'node:util';
import { supportsColor } from '@withstudiocms/cli-kit/colors';
import { date } from '@withstudiocms/cli-kit/messages';
import { Effect } from 'effect';

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
		send(`${styleText(['blue', 'bold'], `DEBUG [${date}]:`)} ${message}`);
	},
};

/**
 * Builds a debug logger function that logs debug messages conditionally based on the `debug` flag.
 * The returned logger function attempts to log the provided message, formatting it with color if supported.
 *
 * @param debug - A boolean flag indicating whether debug logging is enabled.
 * @returns An Effect-wrapped function that logs a debug message if debugging is enabled.
 */
export const buildDebugLogger = Effect.fn(function* (debug: boolean) {
	return Effect.fn((message: string) =>
		Effect.try(() => {
			if (!debug) return;
			if (!supportsColor) {
				send(`DEBUG [${date}]: ${message}`);
				return;
			}
			send(`${styleText(['blue', 'bold'], `DEBUG [${date}]:`)} ${message}`);
		})
	);
});
