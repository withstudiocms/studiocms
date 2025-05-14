import _logger from 'studiocms:logger';
import { Effect, LogLevel, Logger, pipe } from 'effect';

// Custom logger that outputs log messages to the console
export const logger = (label: string) =>
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

const layer = (label: string) => Logger.replace(Logger.defaultLogger, logger(label));

export const RuntimeLogger =
	(label: string, logLevel: LogLevel.LogLevel) =>
	<A, E, R>(self: Effect.Effect<A, E, R>) =>
		pipe(self, Logger.withMinimumLogLevel(logLevel), Effect.provide(layer(label)));

// const program = Effect.gen(function* () {
// 	yield* Effect.log('start');
// 	// yield* task1;
// 	// yield* task2;
// 	yield* Effect.log('done');
// });

// const test = Effect.runPromise(program.pipe(RuntimeLogger('test', LogLevel.Debug)));
