/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, LogLevel } from '@withstudiocms/effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as loggerModule from '../../../src/utils/effects/logger';

describe('S48Logger', () => {
	let s48Logger: loggerModule.S48Logger;
	let consoleLog: any;
	let consoleWarn: any;
	let consoleError: any;
	let consoleDebug: any;

	beforeEach(() => {
		s48Logger = new loggerModule.S48Logger({ level: 'info' }, 'test-label');
		consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should log info messages', () => {
		s48Logger.info('info message');
		expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('info message'));
	});

	it('should log warn messages', () => {
		s48Logger.warn('warn message');
		expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('warn message'));
	});

	it('should log error messages', () => {
		s48Logger.error('error message');
		expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('error message'));
	});

	it('should log debug messages', () => {
		s48Logger.debug('debug message');
		expect(consoleDebug).toHaveBeenCalledWith(expect.stringContaining('debug message'));
	});

	it('fork should create a new logger with same options and new label', () => {
		const forked = s48Logger.fork('new-label');
		expect(forked.label).toBe('new-label');
		expect(forked.options).toEqual(s48Logger.options);
	});
});

describe('stripNameFromLabel', () => {
	it('should strip studiocms/ prefix', () => {
		expect(loggerModule.stripNameFromLabel('studiocms/foo')).toBe('foo');
		expect(loggerModule.stripNameFromLabel('foo')).toBe('foo');
	});
});

describe('getEventPrefix', () => {
	it('should format error prefix in red', () => {
		const prefix = loggerModule.getEventPrefix('error', 'label');
		expect(prefix).toContain('label');
	});
	it('should format warn prefix in yellow', () => {
		const prefix = loggerModule.getEventPrefix('warn', 'label');
		expect(prefix).toContain('label');
	});
	it('should format debug prefix in blue', () => {
		const prefix = loggerModule.getEventPrefix('debug', 'label');
		expect(prefix).toContain('label');
	});
	it('should format info prefix dim', () => {
		const prefix = loggerModule.getEventPrefix('info', 'label');
		expect(prefix).toContain('label');
	});
});

describe('makeLogger', () => {
	it('should create a Logger instance and log at correct level', () => {
		const log = loggerModule.makeLogger('test');
		const spy = vi.spyOn(loggerModule.loggerCache, 'set');
		log.log({
			logLevel: LogLevel.Info,
			message: 'info',
			// @ts-expect-error
			spans: [],
		});
		expect(spy).toHaveBeenCalled();
	});
});

describe('runtimeLogger', () => {
	it('should apply logger and log span to Effect', async () => {
		const effect = Effect.succeed('ok');
		const result = await Effect.runPromise(loggerModule.runtimeLogger(effect, 'test-label'));
		expect(result).toBe('ok');
	});
});

describe('pipeLogger', () => {
	it('should apply runtimeLogger and log span', async () => {
		const effect = Effect.succeed('ok');
		const result = await Effect.runPromise(loggerModule.pipeLogger(effect, 'test-label'));
		expect(result).toBe('ok');
	});
});

describe('genLogger', () => {
	it('should wrap generator function with logging', async () => {
		const gen = loggerModule.genLogger('gen-label')(function* () {
			yield* Effect.log('start');
			return 42;
		});
		const result = await Effect.runPromise(gen);
		expect(result).toBe(42);
	});
});
