import { styleText } from 'node:util';
import { Config, Effect, Layer, List, Logger, LogLevel } from '@withstudiocms/effect';

export function stripNameFromLabel(label: string): string {
	const prefix = 'studiocms/';
	return label.startsWith(prefix) ? label.slice(prefix.length) : label;
}

/**
 * A cache that stores instances of `AstroIntegrationLogger` associated with their string keys.
 * This is used to avoid creating multiple logger instances for the same key.
 */
export const loggerCache = new Map<string, SDKLogger>();

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino

export const levels: Record<LoggerLevel, number> = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
};

export interface LogOptions {
	level: LoggerLevel;
}

const dateTimeFormat = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});

function getLevelPrefix(level: LoggerLevel) {
	const levelLabel = level.toUpperCase();
	switch (level) {
		case 'error':
			return `[${levelLabel}]`;
		case 'warn':
			return `[${levelLabel}]`;
		case 'debug':
			return `[${levelLabel}]`;
		default:
			return '';
	}
}

export const getEventPrefix = (level: LoggerLevel, label?: string) => {
	const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
	const prefix = [];
	if (level === 'error' || level === 'warn' || level === 'debug') {
		prefix.push(styleText('bold', timestamp));
		prefix.push(getLevelPrefix(level));
	} else {
		prefix.push(timestamp);
	}
	if (label) {
		prefix.push(`[${label}]`);
	}
	if (level === 'error') {
		return styleText('red', prefix.join(' '));
	}
	if (level === 'warn') {
		return styleText('yellow', prefix.join(' '));
	}
	if (level === 'debug') {
		return styleText('blue', prefix.join(' '));
	}
	if (prefix.length === 1) {
		/* v8 ignore start */
		return styleText('dim', prefix[0]);
		/* v8 ignore stop */
	}
	return `${styleText('dim', prefix[0])} ${styleText('blue', prefix.splice(1).join(' '))}`;
};

export class SDKLogger {
	options: LogOptions;
	label: string;

	constructor(logging: LogOptions, label: string) {
		this.options = logging;
		this.label = label;
	}

	/**
	 * Creates a new logger instance with a new label, but the same log options.
	 */
	fork(label: string): SDKLogger {
		return new SDKLogger(this.options, label);
	}

	info(message: string) {
		console.log(`${getEventPrefix('info', this.label)} ${message}`);
	}
	warn(message: string) {
		console.warn(`${getEventPrefix('warn', this.label)} ⚠️ ${message}`);
	}
	error(message: string) {
		console.error(`${getEventPrefix('error', this.label)} ❌ ${message}`);
	}
	debug(message: string) {
		console.debug(`${getEventPrefix('debug', this.label)} 🐛 ${message}`);
	}
}

const _logger = new SDKLogger({ level: 'info' }, 'studiocms:runtime');

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
export const makeLogger = Logger.make(({ logLevel, message: _message, spans }) => {
	const label = 'sdk';
	const logger =
		loggerCache.get(label) ?? _logger.fork(`studiocms:runtime/${stripNameFromLabel(label)}`);
	loggerCache.set(label, logger);

	const list = List.toArray(spans);

	const spanPart = list.length ? ` :: ${list.join(' › ')}` : '';
	const message = `${String(_message)}${spanPart}`;

	/* v8 ignore start */
	switch (logLevel) {
		case LogLevel.Trace:
		case LogLevel.Debug: {
			// Debug Emoji followed by message
			logger.debug(`${message}`);
			break;
		}
		case LogLevel.Error:
		case LogLevel.Fatal: {
			logger.error(`${message}`);
			break;
		}
		case LogLevel.Warning: {
			logger.warn(`${message}`);
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
	/* v8 ignore stop */
});

/**
 * Sets the logger level based on the `STUDIOCMS_LOGLEVEL` environment variable,
 * defaulting to `LogLevel.Info` if the variable is not set or invalid.
 */
export const setLoggerLevel = Config.withDefault(
	Config.logLevel('STUDIOCMS_LOGLEVEL'),
	LogLevel.Info
).pipe(Effect.andThen(Logger.minimumLogLevel), Layer.unwrapEffect);
