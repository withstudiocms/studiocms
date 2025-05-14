import config from 'studiocms:config';
import _logger from 'studiocms:logger';
import { Effect, LogLevel, Logger } from 'effect';
import { fromLiteral } from 'effect/LogLevel';

/**
 * Creates a logger instance with a specific label for categorizing log messages.
 *
 * @param label - A string used to label the logger instance. This label is appended
 *                to the logger's namespace to help identify the source of log messages.
 *
 * @returns A logger function that processes log messages based on their log level.
 *          The logger supports the following log levels:
 *          - `LogLevel.Trace` and `LogLevel.Debug`: Logs messages as debug.
 *          - `LogLevel.Error` and `LogLevel.Fatal`: Logs messages as errors.
 *          - `LogLevel.Warning`: Logs messages as warnings.
 *          - `LogLevel.All`, `LogLevel.Info`, and `LogLevel.None`: Logs messages as info.
 *          - Any other log level defaults to logging messages as debug.
 */
export const makeLogger = (label: string) =>
	Logger.make(({ logLevel, message: _message }) => {
		const logger = _logger.fork(`studiocms:runtime/${label}`);
		const message = String(_message);

		switch (logLevel) {
			case LogLevel.Trace:
			case LogLevel.Debug: {
				logger.debug(message);
				break;
			}
			case LogLevel.Error:
			case LogLevel.Fatal: {
				logger.error(message);
				break;
			}
			case LogLevel.Warning: {
				logger.warn(message);
				break;
			}
			case LogLevel.All:
			case LogLevel.Info:
			case LogLevel.None: {
				logger.info(message);
				break;
			}
			default: {
				logger.debug(message);
			}
		}
	});

/**
 * Creates a runtime logger effect transformer that applies a specific label to log messages
 * and configures the logging behavior based on the provided log level.
 *
 * @param label - A string label to associate with the logger for identifying log messages.
 * @returns A higher-order function that takes an `Effect` and returns a new `Effect` with
 *          the logger configuration applied.
 */
export const RuntimeLogger =
	(label: string) =>
	<A, E, R>(self: Effect.Effect<A, E, R>) =>
		self.pipe(
			Logger.withMinimumLogLevel(fromLiteral(config.logLevel)),
			Effect.provide(Logger.replace(Logger.defaultLogger, makeLogger(label)))
		);

// const program = Effect.gen(function* () {
// 	yield* Effect.log('start');
// 	// yield* task1;
// 	// yield* task2;
// 	yield* Effect.log('done');
// });

// const test = Effect.runPromise(program.pipe(RuntimeLogger('test')));
