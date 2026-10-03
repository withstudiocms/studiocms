import type { AstroIntegrationLogger } from 'astro';

/**
 * Represents an array of message objects.
 * Each message object contains information about a log message.
 *
 * @property {string} label - The label associated with the message.
 * @property {'info' | 'warn' | 'error' | 'debug'} logLevel - The level of the log message.
 * @property {string} message - The content of the log message.
 */
export type Messages = {
	label: string;
	logLevel: 'info' | 'warn' | 'error' | 'debug';
	message: string;
}[];

/**
 * Options for configuring the integration logger.
 *
 * @property logLevel - The minimum level of messages to log. Can be 'info', 'warn', 'error', or 'debug'.
 * @property logger - The logger instance to use for logging messages.
 * @property verbose - Optional flag to enable verbose logging output.
 */
export type LoggerOpts = {
	logLevel: 'info' | 'warn' | 'error' | 'debug';
	logger: AstroIntegrationLogger;
	verbose?: boolean;
};

/**
 * Logs a message using the provided logger and log level, with optional verbosity control.
 *
 * @param opts - An object containing logger options:
 *   - `logLevel`: The level at which to log the message (e.g., 'debug', 'info', 'warn', 'error').
 *   - `logger`: The logger instance with methods corresponding to log levels.
 *   - `verbose`: If true, always logs the message; if false, only logs for levels other than 'debug' and 'info'.
 * @param message - The message to be logged.
 * @returns A promise that resolves when logging is complete.
 */
export const integrationLogger = async (opts: LoggerOpts, message: string): Promise<void> => {
	const { logLevel, logger, verbose } = opts;

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
 * Creates a new `AstroIntegrationLogger` instance scoped to a specific plugin.
 *
 * @param id - The unique identifier for the plugin.
 * @param logger - The base `AstroIntegrationLogger` to fork from.
 * @returns A new `AstroIntegrationLogger` instance with a namespace prefixed by `plugin:{id}`.
 */
export function pluginLogger(id: string, logger: AstroIntegrationLogger): AstroIntegrationLogger {
	const newLogger = logger.fork(`plugin:${id}`);
	return newLogger;
}

/**
 * Logs a series of messages using the provided Astro integration logger.
 *
 * @param messages - An array of message objects, each containing a label, message, and log level.
 * @param options - Options for logging, including a `verbose` flag to control verbosity.
 * @param logger - The Astro integration logger instance used for logging messages.
 *
 * @remarks
 * Each message is logged with a forked logger using its label. The verbosity of 'info' level logs
 * is controlled by the `options.verbose` flag, while other log levels are always logged.
 */
export async function logMessages(
	messages: Messages,
	options: { verbose: boolean },
	logger: AstroIntegrationLogger
) {
	// Log messages at the end of the build
	for (const { label, message, logLevel } of messages) {
		await integrationLogger(
			{
				logger: logger.fork(label),
				logLevel,
				verbose: logLevel === 'info' || logLevel === 'debug' ? options.verbose : true,
			},
			message
		);
	}
}
