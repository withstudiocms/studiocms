/**
 * @module @withstudiocms/cli-kit/messages
 *
 * This module provides utility functions and constants for generating
 * formatted messages, handling user names, and creating CLI UI elements
 * such as boxes and animated messages. It is designed to enhance the
 * user experience in command-line interfaces by providing visually appealing
 * and informative outputs.
 */

import { exec } from 'node:child_process';
import type { Key } from 'node:readline';
import readline from 'node:readline';
import { styleText } from 'node:util';
import ansiEscapes from 'ansi-escapes';
import _boxen, { type Options as BoxenOptions } from 'boxen';
import cliCursor from 'cli-cursor';
import isUnicodeSupported from 'is-unicode-supported';
import sliceAnsi from 'slice-ansi';
import stripAnsi from 'strip-ansi';
import wrapAnsi from 'wrap-ansi';
import { StudioCMSColorwayBg } from './colors.js';

export { _boxen as realBoxen };

/**
 * A date-time formatter configured for US English locale that formats time in 12-hour format.
 *
 * @remarks
 * This formatter displays only hours and minutes in 2-digit format (e.g., "02:30 PM").
 *
 * @example
 * ```typescript
 * const formattedTime = dt.format(new Date()); // Returns "02:30 PM"
 * ```
 */
export const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

/**
 * The current date formatted according to the DateTimeFormat instance.
 * Uses the `dt` formatter to convert the current date/time to a string representation.
 *
 * @constant
 * @type {string}
 */
export const date: string = dt.format(new Date());

/**
 * Standard cancellation message displayed when a user cancels an operation.
 *
 * This message informs the user that the operation has been cancelled and provides
 * a support link to the StudioCMS Discord chat for assistance.
 *
 * @example
 * ```typescript
 * console.log(cancelMessage);
 * // Output: "Operation cancelled, exiting... If you're stuck, join us at https://chat.studiocms.dev"
 * ```
 */
export const cancelMessage =
	"Operation cancelled, exiting... If you're stuck, join us at https://chat.studiocms.dev";

/**
 * Creates a formatted cancellation message with optional tip.
 *
 * @param message - The main cancellation message to display
 * @param tip - Optional additional tip or guidance text to show below the message
 * @returns A formatted string with a yellow "cancelled" badge, the message, and optional tip with proper indentation
 *
 * @example
 * ```typescript
 * cancelled("Operation was cancelled by user");
 * // Returns formatted message with cancelled badge
 *
 * cancelled("Operation was cancelled by user", "Press Ctrl+C to exit");
 * // Returns formatted message with cancelled badge and tip
 * ```
 */
export function cancelled(message: string, tip?: string) {
	const badge = styleText(['bgYellow', 'black'], ' cancelled ');
	const headline = styleText(['yellow'], message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

/**
 * Formats a success message with an optional tip for CLI output.
 *
 * @param message - The main success message to display
 * @param tip - Optional tip or additional information to show below the main message
 * @returns A formatted string with a green success badge, the message, and optional tip, properly indented
 *
 * @example
 * ```ts
 * console.log(success('Build completed successfully', 'Run `npm start` to preview'));
 * // Output:
 * //
 * //   success  Build completed successfully
 * //   ▶ Run `npm start` to preview
 * ```
 */
export function success(message: string, tip?: string) {
	const badge = styleText(['bgGreen', 'black'], ' success ');
	const headline = styleText(['green'], message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

/**
 * Retrieves the user's name from the system.
 *
 * Attempts to get the name through the following methods in order:
 * 1. First word of the git config user.name
 * 2. First word of the 'whoami' command output
 * 3. Falls back to 'StudioCMS User' if both methods fail
 *
 * @returns A Promise that resolves to the user's name as a string
 *
 * @example
 * ```typescript
 * const userName = await getName();
 * console.log(userName); // "John" or "StudioCMS User"
 * ```
 */
export const getName = () =>
	new Promise<string>((resolve) => {
		exec('git config user.name', { encoding: 'utf-8' }, (_1, gitName) => {
			/* v8 ignore start */
			if (gitName.trim()) {
				return resolve(gitName.split(' ')[0].trim());
			}
			/* v8 ignore stop */
			exec('whoami', { encoding: 'utf-8' }, (_3, whoami) => {
				if (whoami.trim()) {
					return resolve(whoami.split(' ')[0].trim());
				}
				/* v8 ignore start */
				return resolve('StudioCMS User');
				/* v8 ignore stop */
			});
		});
	});

/**
 * Type alias representing the parameters accepted by the `styleText` function.
 *
 * This utility type extracts the first parameter type from the `styleText` function,
 * allowing for type-safe usage of style formatting options throughout the codebase.
 *
 * @example
 * ```typescript
 * const params: StyleTextFormatParams = { color: 'blue', bold: true };
 * ```
 */
export type StyleTextFormatParams = Parameters<typeof styleText>[0];

/**
 * Creates a labeled text string with custom background color and text styling.
 *
 * @param text - The text content to be labeled
 * @param c - The color function to apply as background. Defaults to StudioCMSColorwayBg
 * @param t - The text formatting parameters for styling. Defaults to ['whiteBright']
 * @returns A formatted string with the specified background color and text style, padded with spaces
 *
 * @example
 * ```typescript
 * label("Hello World"); // Returns " Hello World " with default styling
 * label("Error", redBg, ['bold', 'white']); // Returns " Error " with red background and bold white text
 * ```
 */
export const label = (
	text: string,
	c = StudioCMSColorwayBg,
	t: StyleTextFormatParams = ['whiteBright']
) => c(` ${styleText(t, text)} `);

export const action = (key: Key, isSelect: boolean) => {
	if (key.meta && key.name !== 'escape') return;

	if (key.ctrl) {
		if (key.name === 'a') return 'first';
		if (key.name === 'c') return 'abort';
		if (key.name === 'd') return 'abort';
		/* v8 ignore start */
		if (key.name === 'e') return 'last';
		if (key.name === 'g') return 'reset';
		/* v8 ignore stop */
	}

	if (isSelect) {
		if (key.name === 'j') return 'down';
		/* v8 ignore start */
		if (key.name === 'k') return 'up';
		/* v8 ignore stop */
		if (key.ctrl && key.name === 'n') return 'down';
		if (key.ctrl && key.name === 'p') return 'up';
	}

	if (key.name === 'return') return 'submit';
	if (key.name === 'enter') return 'submit'; // ctrl + J
	if (key.name === 'backspace') return 'delete';
	if (key.name === 'delete') return 'deleteForward';
	if (key.name === 'abort') return 'abort';
	if (key.name === 'escape') return 'exit';
	if (key.name === 'tab') return 'next';
	if (key.name === 'pagedown') return 'nextPage';
	if (key.name === 'pageup') return 'prevPage';
	if (key.name === 'home') return 'home';
	if (key.name === 'end') return 'end';
	if (key.name === 'up') return 'up';
	if (key.name === 'down') return 'down';
	if (key.name === 'right') return 'right';
	if (key.name === 'left') return 'left';

	return false;
};

let stdout = process.stdout;

const stdin = process.stdin;

/**
 * Sets the output stream for writing messages.
 *
 * @param writable - The writable stream to use for standard output. Typically `process.stdout` or a compatible stream.
 *
 * @remarks
 * This function allows redirecting the output stream used by the CLI toolkit,
 * which is useful for testing or capturing output to alternative destinations.
 *
 * @example
 * ```typescript
 * import { setStdout } from '@withstudiocms/cli-kit';
 *
 * // Redirect output to a custom stream
 * setStdout(customWritableStream);
 * ```
 */
export function setStdout(writable: typeof process.stdout) {
	stdout = writable;
}

interface BoxenBody {
	ln0?: string;
	ln1?: string;
	ln2?: string;
	ln3?: string;
	ln4?: string;
	ln5?: string;
}

/**
 * Creates a formatted box with a logo, header, body content, and optional footer.
 *
 * @param header - Optional header text to display at the top of the box
 * @param body - Optional body content with up to 6 lines (ln0-ln5) displayed alongside the logo
 * @param footer - Optional footer text to display at the bottom of the box
 * @param boxenOptions - Configuration options for the boxen display (default: { padding: 0, borderStyle: 'none' })
 *
 * @returns A formatted string containing the boxed content with logo and text
 *
 * @remarks
 * - The function automatically adjusts prefix spacing based on terminal width (< 80 columns)
 * - The logo is displayed as a white bold ASCII art pattern on a black background
 * - Body content lines are aligned to the right of the logo with appropriate spacing
 * - Null values in header, body lines, and footer are filtered out
 */
export function boxen(
	header?: string,
	body?: BoxenBody,
	footer?: string,
	boxenOptions: BoxenOptions = { padding: 0, borderStyle: 'none' }
) {
	const prefix = stdout.columns < 80 ? ' ' : ' '.repeat(4);

	const whiteBold = (text: string) => styleText(['white', 'bold'], text);

	const logo = _boxen(
		[
			`${whiteBold('    ████')}`,
			`${whiteBold('  █ ████')}`,
			`${whiteBold('█ █▄▄▄  ')}`,
			`${whiteBold('█▄▄▄    ')}`,
		].join('\n'),
		{
			padding: 1,
			borderStyle: 'none',
			backgroundColor: 'black',
		}
	).split('\n');

	const boxContent = [
		header ? `${header}\n` : null,
		`${logo[0]}${prefix}${body?.ln0 || ''}`,
		`${logo[1]}${prefix}${body?.ln1 || ''}`,
		`${logo[2]}${prefix}${body?.ln2 || ''}`,
		`${logo[3]}${prefix}${body?.ln3 || ''}`,
		`${logo[4]}${prefix}${body?.ln4 || ''}`,
		`${logo[5]}${prefix}${body?.ln5 || ''}`,
		footer ? `\n${footer}` : null,
	]
		.filter((val) => typeof val === 'string')
		.join('\n');

	return _boxen(boxContent, boxenOptions);
}

/**
 * Determines whether Unicode characters are supported in the current terminal environment.
 * This value is used throughout the application to conditionally render Unicode symbols
 * or fallback to ASCII alternatives for better cross-platform terminal compatibility.
 *
 * @constant
 * @type {boolean}
 */
const unicode: boolean = isUnicodeSupported();

/**
 * Returns a string character based on unicode support.
 *
 * @param c - The unicode character to display if unicode is supported
 * @param fallback - The fallback character to display if unicode is not supported
 * @returns The selected character based on the `unicode` flag
 *
 * @example
 * ```ts
 * const check = s('✓', 'v');
 * ```
 */
const s = (c: string, fallback: string) => (unicode ? c : fallback);

/**
 * A vertical bar character used as a separator in CLI output.
 * Uses the stylized character '│' with a fallback to '|' for compatibility.
 */
const S_BAR = s('│', '|');

/**
 * Options for customizing log message output.
 *
 * @property {string} [symbol] - Optional symbol or icon to display alongside the log message.
 */
export type LogMessageOptions = {
	symbol?: string;
};

/**
 * The default height of the terminal window in lines.
 * Used as a fallback value when the actual terminal height cannot be determined.
 * @constant {number}
 * @default 24
 */
const defaultTerminalHeight = 24;

/**
 * Gets the width of the terminal based on the provided columns.
 *
 * @param options - Configuration object for terminal width
 * @param options.columns - The number of columns available in the terminal (defaults to 80)
 * @returns The number of columns as the terminal width
 *
 * @example
 * ```ts
 * const width = getWidth({ columns: 100 }); // Returns 100
 * const defaultWidth = getWidth({}); // Returns 80
 * ```
 */
const getWidth = ({ columns = 80 }) => columns;

/**
 * Fits the given text to the terminal height by removing lines from the top if necessary.
 *
 * @param stream - The output stream (e.g., stdout) to get the terminal height from
 * @param text - The text to fit to the terminal height
 * @returns The text trimmed from the top if it exceeds the terminal height, otherwise the original text
 *
 * @remarks
 * If the number of lines in the text exceeds the terminal height, the function removes
 * lines from the beginning and uses `sliceAnsi` to preserve ANSI formatting while trimming.
 * Falls back to `defaultTerminalHeight` if the stream doesn't provide row information.
 */
const fitToTerminalHeight = (stream: typeof stdout, text: string) => {
	const terminalHeight = stream.rows ?? defaultTerminalHeight;
	const lines = text.split('\n');
	const toRemove = Math.max(0, lines.length - terminalHeight);
	return toRemove
		? /* v8 ignore start */
			sliceAnsi(text, stripAnsi(lines.slice(0, toRemove).join('\n')).length + 1)
		: /* v8 ignore stop */
			text;
};

/**
 * Creates a message updater for terminal output with Clack-style formatting.
 *
 * This function returns a render function that can update messages in place on the terminal,
 * useful for displaying progress or status updates without scrolling. The messages are
 * formatted with a vertical bar symbol and support multi-line content.
 *
 * @param stream - The output stream to write to (defaults to stdout)
 * @param options - Configuration options
 * @param options.showCursor - Whether to show the cursor during rendering (defaults to false)
 * @param options.symbol - The symbol to use for the message prefix (defaults to a grey bar)
 *
 * @returns A render function with the following signature:
 * - `render(message: string)` - Updates the terminal with the given message
 * - `render.clear()` - Clears the current message from the terminal
 * - `render.done()` - Resets state and shows cursor if it was hidden
 *
 * @example
 * ```typescript
 * const update = createClackMessageUpdate();
 * update('Processing...');
 * // Later:
 * update('Processing complete!');
 * update.done();
 * ```
 */
export function createClackMessageUpdate(
	stream = stdout,
	{ showCursor = false, symbol = styleText('grey', S_BAR) } = {}
) {
	let previousLineCount = 0;
	let previousWidth = getWidth(stream);
	let previousOutput = '';

	const reset = () => {
		previousOutput = '';
		previousWidth = getWidth(stream);
		previousLineCount = 0;
	};

	const render = (arguments_: string) => {
		if (!showCursor) {
			cliCursor.hide();
		}

		const parts = [];

		const [firstLine, ...lines] = arguments_.split('\n');
		parts.push(
			`${symbol}  ${firstLine}`,
			...lines.map((ln) => `${styleText('grey', S_BAR)}  ${ln}`)
		);

		let output = fitToTerminalHeight(stream, `${parts.join('\n')}\n`);
		const width = getWidth(stream);

		/* v8 ignore start */
		if (output === previousOutput && previousWidth === width) {
			return;
		}
		/* v8 ignore stop */

		previousOutput = output;
		previousWidth = width;
		output = wrapAnsi(output, width, { trim: false, hard: true, wordWrap: false });

		stream.write(ansiEscapes.eraseLines(previousLineCount) + output);
		previousLineCount = output.split('\n').length;
	};

	render.clear = () => {
		stream.write(ansiEscapes.eraseLines(previousLineCount));
		reset();
	};

	/* v8 ignore start */
	render.done = () => {
		reset();
		if (!showCursor) {
			cliCursor.show();
		}
	};
	/* v8 ignore stop */

	return render;
}

/**
 * Generates a random integer between the specified minimum and maximum values (inclusive).
 *
 * @param min - The minimum value (inclusive) of the random range
 * @param max - The maximum value (inclusive) of the random range
 * @returns A random integer between min and max (inclusive)
 *
 * @example
 * ```ts
 * randomBetween(1, 10); // Returns a random number between 1 and 10
 * randomBetween(0, 100); // Returns a random number between 0 and 100
 * ```
 */
export const randomBetween = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1) + min);

type NonEmptyArray<T> = [T, ...T[]];

/**
 * Selects a random element from the provided array(s).
 *
 * @param arr - One or more arrays containing elements of type T
 * @returns A random element of type T from the combined arrays, or undefined if no elements are provided
 */
export const random = <T>(...arr: NonEmptyArray<T | ReadonlyArray<T>>): T => {
	const flattenedArray = arr.flat(1) as T[];
	return flattenedArray[Math.floor(Math.random() * flattenedArray.length)];
};

/**
 * Creates a promise that resolves after a specified delay.
 *
 * @param ms - The number of milliseconds to wait before resolving the promise
 * @returns A promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * // Wait for 1 second
 * await sleep(1000);
 * ```
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Displays an animated message or series of messages to the user with typewriter effect.
 * Messages are displayed in a boxed format and can be cleared after display.
 *
 * @param msg - A single message string or an array of message strings to display sequentially
 * @param options - Configuration options for message display
 * @param options.clear - If true, clears the message after display. If false, leaves the final message visible. Defaults to false
 *
 * @returns A Promise that resolves when all messages have been displayed and the display is complete
 *
 * @remarks
 * - The function sets the terminal to raw mode if TTY is available
 * - Users can press any key to skip the animation and proceed immediately
 * - Pressing a key that triggers 'abort' action will exit the process
 * - Arrow keys (up, down, left, right) are ignored and don't skip the animation
 * - Words in each message are displayed with a random delay between 75-200ms
 * - There's a 1200-1400ms pause between complete messages
 * - All event listeners and raw mode are cleaned up after execution
 *
 * @example
 * ```typescript
 * // Display a single message
 * await say("Hello, World!");
 *
 * // Display multiple messages that clear after
 * await say(["First message", "Second message"], { clear: true });
 * ```
 */
export const say = async (msg: string | string[] = [], { clear = false } = {}) => {
	/* v8 ignore start */
	const messages = Array.isArray(msg) ? msg : [msg];
	const rl = readline.createInterface({ input: stdin, escapeCodeTimeout: 50 });
	const logUpdate = createClackMessageUpdate(stdout, { showCursor: false });
	readline.emitKeypressEvents(stdin, rl);
	let i = 0;
	let cancelled = false;
	const done = async () => {
		stdin.off('keypress', done);
		if (stdin.isTTY) stdin.setRawMode(false);
		rl.close();
		cancelled = true;
		if (i < messages.length - 1) {
			logUpdate.clear();
		} else if (clear) {
			logUpdate.clear();
		} else {
			logUpdate.done();
		}
	};

	if (stdin.isTTY) stdin.setRawMode(true);
	stdin.on('keypress', (_str, key) => {
		if (stdin.isTTY) stdin.setRawMode(true);
		const k = action(key, true);
		if (k === 'abort') {
			done();
			return process.exit(0);
		}
		// biome-ignore lint/suspicious/noExplicitAny: this is fine
		if (['up', 'down', 'left', 'right'].includes(k as any)) return;
		done();
	});

	for (let message of messages) {
		// biome-ignore lint/correctness/noSelfAssign: this is fine
		message = message;
		const _message = Array.isArray(message) ? message : message.split(' ');
		const msg = [];
		let _j = 0;
		for (let word of [''].concat(_message)) {
			// biome-ignore lint/correctness/noSelfAssign: this is fine
			word = word;
			if (word) msg.push(word);
			logUpdate(`\n${boxen(undefined, { ln3: msg.join(' ') })}`);
			if (!cancelled) await sleep(randomBetween(75, 200));
			_j++;
		}
		if (!cancelled) await sleep(100);
		const tmp = await Promise.all(_message).then((res) => res.join(' '));
		const text = `\n${boxen(undefined, { ln3: tmp })}`;
		logUpdate(text);
		if (!cancelled) await sleep(randomBetween(1200, 1400));
		i++;
	}
	stdin.off('keypress', done);
	await sleep(100);
	done();
	if (stdin.isTTY) stdin.setRawMode(false);
	stdin.removeAllListeners('keypress');
};
/* v8 ignore stop */
