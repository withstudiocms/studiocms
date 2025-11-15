/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */

import { Effect, LogLevel } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as loggerModule from '../../../src/utils/effects/logger';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'S48Logger Utility tests';

describe(parentSuiteName, () => {
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

	test('should log info messages', async () => {
		const testName = 'should log info messages';
		const tags = [...sharedTags, 'utility:S48Logger', 'method:info'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Logging info message', async () => {
			s48Logger.info('info message');
			expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('info message'));
		});
	});

	test('should log warn messages', async () => {
		const testName = 'should log warn messages';
		const tags = [...sharedTags, 'utility:S48Logger', 'method:warn'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Logging warn message', async () => {
			s48Logger.warn('warn message');
			expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('warn message'));
		});
	});

	test('should log error messages', async () => {
		const testName = 'should log error messages';
		const tags = [...sharedTags, 'utility:S48Logger', 'method:error'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Logging error message', async () => {
			s48Logger.error('error message');
			expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('error message'));
		});
	});

	test('should log debug messages', async () => {
		const testName = 'should log debug messages';
		const tags = [...sharedTags, 'utility:S48Logger', 'method:debug'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Logging debug message', async () => {
			s48Logger.debug('debug message');
			expect(consoleDebug).toHaveBeenCalledWith(expect.stringContaining('debug message'));
		});
	});

	test('fork should create a new logger with same options and new label', async () => {
		const testName = 'fork should create a new logger with same options and new label';
		const tags = [...sharedTags, 'utility:S48Logger', 'method:fork'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Forking logger', async () => {
			const forked = s48Logger.fork('new-label');
			expect(forked.label).toBe('new-label');
			expect(forked.options).toEqual(s48Logger.options);
		});
	});

	[
		{
			label: 'studiocms/foo',
			expected: 'foo',
		},
		{
			label: 'bar',
			expected: 'bar',
		},
	].forEach(({ label, expected }) => {
		test(`stripNameFromLabel should strip prefix from ${label}`, async () => {
			const testName = `stripNameFromLabel should strip prefix from ${label}`;
			const tags = [...sharedTags, 'utility:S48Logger', 'method:stripNameFromLabel'];

			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.step(`Stripping prefix from ${label}`, async () => {
				const result = loggerModule.stripNameFromLabel(label);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			level: 'info',
			label: 'label',
			toContain: 'label',
		},
		{
			level: 'warn',
			label: 'label',
			toContain: 'label',
		},
		{
			level: 'error',
			label: 'label',
			toContain: 'label',
		},
		{
			level: 'debug',
			label: 'label',
			toContain: 'label',
		},
	].forEach(({ level, label, toContain }) => {
		test(`getEventPrefix should format ${level} prefix correctly`, async () => {
			const testName = `getEventPrefix should format ${level} prefix correctly`;
			const tags = [...sharedTags, 'utility:S48Logger', 'method:getEventPrefix'];

			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.step(`Formatting ${level} prefix`, async () => {
				const prefix = loggerModule.getEventPrefix(level as any, label);
				expect(prefix).toContain(toContain);
			});
		});
	});

	test('makeLogger should create a Logger instance and log at correct level', async () => {
		const testName = 'makeLogger should create a Logger instance and log at correct level';
		const tags = [...sharedTags, 'utility:S48Logger', 'function:makeLogger'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Creating logger and logging info message', async () => {
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

	test('runtimeLogger should apply logger and log span to Effect', async () => {
		const testName = 'runtimeLogger should apply logger and log span to Effect';
		const tags = [...sharedTags, 'utility:S48Logger', 'function:runtimeLogger'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Applying runtimeLogger to Effect', async () => {
			const effect = Effect.succeed('ok');
			const result = await Effect.runPromise(loggerModule.runtimeLogger(effect, 'test-label'));
			expect(result).toBe('ok');
		});
	});

	test('pipeLogger should apply runtimeLogger and log span', async () => {
		const testName = 'pipeLogger should apply runtimeLogger and log span';
		const tags = [...sharedTags, 'utility:S48Logger', 'function:pipeLogger'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Applying pipeLogger to Effect', async () => {
			const effect = Effect.succeed('ok');
			const result = await Effect.runPromise(loggerModule.pipeLogger(effect, 'test-label'));
			expect(result).toBe('ok');
		});
	});

	test('genLogger should wrap generator function with logging', async () => {
		const testName = 'genLogger should wrap generator function with logging';
		const tags = [...sharedTags, 'utility:S48Logger', 'function:genLogger'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Wrapping generator function with genLogger', async () => {
			const gen = loggerModule.genLogger('gen-label')(function* () {
				yield* Effect.log('start');
				return 42;
			});
			const result = await Effect.runPromise(gen);
			expect(result).toBe(42);
		});
	});
});
