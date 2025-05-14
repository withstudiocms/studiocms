import config from 'studiocms:config';
import _logger from 'studiocms:logger';
import { Effect, LogLevel, Logger } from 'effect';
import type { Adapter } from 'effect/Effect';
import { dual, pipe } from 'effect/Function';
import type { YieldWrap } from 'effect/Utils';

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
 * @internal
 */
const makeLogger = (label: string) =>
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
			case LogLevel.Info: {
				logger.info(message);
				break;
			}
			default: {
				logger.info(message);
			}
		}
	});

/**
 * Sets the minimum log level for the logger based on the provided configuration.
 *
 * @remarks
 * This function utilizes the `Logger.withMinimumLogLevel` method to adjust the logging level dynamically.
 * The log level is determined by converting the `config.logLevel` value using the `fromLiteral` utility.
 *
 * @param config.logLevel - The log level specified in the configuration, which is converted to the appropriate format.
 * @internal
 */
const setLoggerLevel = Logger.withMinimumLogLevel(LogLevel.fromLiteral(config.logLevel));

/**
 * Sets a custom logger for the Astro Runtime by replacing the default logger with the
 * runtime AstroIntegrationLogger configured with the specified label.
 *
 * @param label - A string used to label the logger, providing context for log messages.
 * @returns An effect that provides the custom logger to the application.
 * @internal
 */
const setLogger = (label: string) =>
	Effect.provide(Logger.replace(Logger.defaultLogger, makeLogger(label)));

/**
 * Creates a runtime logger effect transformer that applies a specific label to log messages
 * and configures the logging behavior based on the provided log level.
 *
 * @param label - A string label to associate with the logger for identifying log messages.
 * @returns A higher-order function that takes an `Effect` and returns a new `Effect` with
 *          the logger configuration applied.
 */
export const runtimeLogger = dual<
	(label: string) => <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>,
	<A, E, R>(self: Effect.Effect<A, E, R>, label: string) => Effect.Effect<A, E, R>
>(2, (self, label) => pipe(self, setLoggerLevel, setLogger(label)));

/**
 * Wraps an `Effect` with additional logging functionality.
 *
 * This function applies a runtime logger and a log span to the provided `Effect`,
 * enabling detailed logging for debugging and monitoring purposes.
 *
 * @param label - A string label used to identify the log entries and span.
 * @param effect - The `Effect` to be wrapped with logging functionality.
 *
 * @returns A new `Effect` that includes runtime logging and a log span.
 *
 * @deprecated replaced by pipeLogger
 */
export const logWrapper = <A, E, R>({
	label,
	effect,
}: {
	label: string;
	effect: Effect.Effect<A, E, R>;
}): Effect.Effect<A, E, R> =>
	pipe(effect, runtimeLogger(label), Effect.withLogSpan(`span-${label}`));

/**
 * Wraps an `Effect` with additional logging functionality.
 *
 * This function applies a runtime logger and a log span to the provided `Effect`,
 * enabling detailed logging for debugging and monitoring purposes.
 *
 * @param label - A string label used to identify the log entries and span.
 * @param effect - The `Effect` to be wrapped with logging functionality.
 *
 * @returns A new `Effect` that includes runtime logging and a log span.
 */
export const pipeLogger =
	(label: string) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		pipe(effect, runtimeLogger(label), Effect.withLogSpan(`span-${label}`));

/**
 * Generates a logger function that wraps an effectful generator function with logging capabilities.
 *
 * @param label - A string label used to identify the logger.
 * @returns A function that takes a generator function `f` and returns an `Effect.Effect` instance.
 *
 * The returned function accepts a generator function `f` that yields wrapped effects (`YieldWrap<Effect.Effect>`).
 * It logs the execution of the generator function and its effects using the provided label.
 *
 * @typeParam Eff - The type of the yielded effects within the generator function.
 * @typeParam AEff - The return type of the generator function.
 *
 * The resulting `Effect.Effect` has the following type parameters:
 * - `AEff`: The return type of the generator function.
 * - `E`: The error type inferred from the yielded effects, or `never` if no effects are yielded.
 * - `R`: The environment type inferred from the yielded effects, or `never` if no effects are yielded.
 */
export const genLogger =
	(label: string) =>
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	<Eff extends YieldWrap<Effect.Effect<any, any, any>>, AEff>(
		f: (resume: Adapter) => Generator<Eff, AEff, never>
	): Effect.Effect<
		AEff,
		[Eff] extends [never]
			? never
			: [Eff] extends [YieldWrap<Effect.Effect<infer _A, infer E, infer _R>>]
				? E
				: never,
		[Eff] extends [never]
			? never
			: [Eff] extends [YieldWrap<Effect.Effect<infer _A, infer _E, infer R>>]
				? R
				: never
	> =>
		pipeLogger(label)(Effect.gen(f));

/**
 * A utility function that logs an error message when an `Effect.fail()` is executed.
 *
 * This function is curried and can be used in two forms:
 * 1. By providing a `message` first, which returns a function that takes an `Effect` and logs the error message.
 * 2. By providing both the `Effect` and the `message` directly.
 *
 * @template A - The type of the success value of the `Effect`.
 * @template E - The type of the error value of the `Effect`.
 * @template R - The type of the environment required by the `Effect`.
 *
 * @param message - The error message to log. Can be a single value or an array of values.
 * @param self - The `Effect` to which the error logging will be applied.
 *
 * @returns A new `Effect` that logs the provided error message when executed.
 */
export const errorTap = dual<
	(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		message: any | ReadonlyArray<any>
	) => <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>,
	<A, E, R>(
		self: Effect.Effect<A, E, R>,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		message: any | ReadonlyArray<any>
	) => Effect.Effect<A, E, R>
>(2, (self, message) =>
	pipe(self, Effect.tap(Effect.logError(...(Array.isArray(message) ? message : [message]))))
);

// // Testing Examples

// const program1 = Effect.gen(function* () {
// 	yield* Effect.log('start');
// 	// yield* task1;
// 	// yield* task2;
// 	yield* Effect.log('done');

// 	return true;
// }).pipe(Effect.withLogSpan('span-program1'));

// const test1 = await Effect.runPromise(program1.pipe(runtimeLogger('test')));

// const program2 = logWrapper({
// 	label: 'program2',
// 	effect: Effect.gen(function* () {
// 		yield* Effect.log('start');
// 		// yield* task1;
// 		// yield* task2;
// 		yield* Effect.log('done');

// 		return true;
// 	}),
// });

// const test2 = await Effect.runPromise(program2);
