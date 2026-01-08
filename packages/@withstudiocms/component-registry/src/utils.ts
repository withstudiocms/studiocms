import { Effect } from '@withstudiocms/effect';
import type { AstroIntegrationLogger } from 'astro';
import { createResolver } from 'astro-integration-kit';
import { ComponentRegistryError } from './errors';

/**
 * Options for configuring the logger.
 *
 * @property logLevel - The minimum level of messages to log. Can be 'info', 'warn', 'error', or 'debug'.
 * @property logger - The logger instance to use, typically an AstroIntegrationLogger.
 * @property verbose - Optional flag to enable verbose logging output.
 */
export type LoggerOpts = {
	logLevel: 'info' | 'warn' | 'error' | 'debug';
	logger: AstroIntegrationLogger;
	verbose?: boolean;
};

/**
 * Logs a message using the provided logger and options.
 *
 * @param opts - The logger options, including log level, logger instance, and verbosity flag.
 * @param opts.logLevel - The log level to use (e.g., 'debug', 'info', 'warn', 'error').
 * @param opts.logger - The logger object with methods corresponding to log levels.
 * @param opts.verbose - If true, always logs the message; if false, logs only if the level is not 'debug' or 'info'.
 * @param message - The message to log.
 * @returns A promise that resolves when logging is complete.
 */
export const integrationLogger = async (opts: LoggerOpts, message: string): Promise<void> => {
	const { logLevel, logger, verbose = false } = opts;

	switch (verbose) {
		case true:
			logger[logLevel](message);
			break;
		case false:
			if (logLevel !== 'debug' && logLevel !== 'info') {
				logger[logLevel](message);
			}
			break;
		default:
			logger[logLevel](message);
	}
};

/**
 * Converts all hyphens in a given string to underscores.
 *
 * @param str - The input string containing hyphens to be converted.
 * @returns A new string with all hyphens replaced by underscores.
 */
export function convertHyphensToUnderscores(str: string): string {
	// Convert hyphens to underscores
	return str.replace(/-/g, '_');
}

/**
 * Converts all underscores in a given string to hyphens.
 *
 * @param str - The input string containing underscores to be converted.
 * @returns A new string with all underscores replaced by hyphens.
 */
export function convertUnderscoresToHyphens(str: string): string {
	// Convert underscores to hyphens
	return str.replace(/_/g, '-');
}

/**
 * Determines the indentation of a given line of text.
 *
 * @param ln - The line of text to analyze.
 * @returns The leading whitespace characters of the line, or an empty string if there is no indentation.
 */
export function getIndent(ln: string): string {
	if (ln.trimStart() === ln) return '';
	return ln.slice(0, ln.length - ln.trimStart().length);
}

/**
 * Removes leading indentation from a multi-line string.
 *
 * @param str - The string from which to remove leading indentation.
 * @returns The dedent string output.
 */
export function dedent(str: string): string {
	const lns = str.replace(/^[\r\n]+/, '').split('\n');
	// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
	let indent = getIndent(lns[0]!);
	if (indent.length === 0 && lns.length > 1) {
		// biome-ignore lint/style/noNonNullAssertion: this is a valid use case for non-null assertion
		indent = getIndent(lns[1]!);
	}
	if (indent.length === 0) return lns.join('\n');
	return lns.map((ln) => (ln.startsWith(indent) ? ln.slice(indent.length) : ln)).join('\n');
}

/**
 * Creates an Effect-based resolver function for resolving component paths.
 *
 * @param base - The base path used to initialize the resolver.
 * @returns An Effect-wrapped function that accepts a callback. The callback receives a `resolve` function,
 * which can be used to resolve component paths relative to the base. If an error occurs during resolution,
 * it is caught, logged to the console, and an Error object is returned with the original error as its cause.
 *
 * @example
 * const resolveEffect = resolver('/components');
 * const result = yield* resolveEffect((resolve) => resolve('Button'));
 */
export const resolver = Effect.fn(function* (base: string) {
	const { resolve: _resolve } = createResolver(base);
	return Effect.fn((fn: (resolve: (...path: Array<string>) => string) => string) =>
		Effect.try({
			try: () => fn(_resolve),
			catch: (error) => {
				console.error('Error occurred while resolving component:', error);
				return new ComponentRegistryError({ message: 'Failed to resolve component', cause: error });
			},
		})
	);
});
