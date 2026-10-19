import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest';
import {
	getLatestVersion,
	integrationLogger,
	logMessages,
	type Messages,
	pluginLogger,
} from '../src/astro-integration/index.js';
import { createMockLogger, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Astro Integration Utility Tests';

vi.mock('./utils/jsonUtils.js', () => ({
	jsonParse: vi.fn((v: string) => JSON.parse(v)),
}));

const mockLogger = {
	error: vi.fn(),
	warn: vi.fn(),
} as any;

const mockFs = {
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
};

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

const FAKE_URL = new URL('file:///tmp/fake-cache.json');

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// integrationLogger tests
	[
		{
			logLevel: 'info' as const,
			verbose: true,
			method: 'info',
			message: 'Test message',
		},
		{
			logLevel: 'warn' as const,
			verbose: undefined,
			method: 'warn',
			message: 'Warn message',
		},
	].forEach(({ logLevel, verbose, method, message }) => {
		test(`${method} logs message at specified logLevel when verbose is ${verbose}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`integrationLogger - ${method} method`);
			await allure.tags(...sharedTags);
			await allure.parameter('logLevel', logLevel);
			await allure.parameter('verbose', String(verbose));
			await allure.parameter('method', method);
			await allure.parameter('message', message);

			await allure.step(`Logging message with ${method} method`, async (ctx) => {
				const logger = createMockLogger();
				await integrationLogger({ logLevel, logger, verbose }, message);
				ctx.parameter('Logged message', message);
				expect(logger[method as keyof typeof logger]).toHaveBeenCalledWith(message);
			});
		});
	});

	[
		{
			logLevel: 'info' as const,
			verbose: false,
			method: 'info',
			message: 'Should not log',
		},
		{
			logLevel: 'debug' as const,
			verbose: false,
			method: 'debug',
			message: 'Should not log',
		},
	].forEach(({ logLevel, verbose, method, message }) => {
		test(`${method} does not log when verbose is false`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`integrationLogger - ${method} method`);
			await allure.tags(...sharedTags);
			await allure.parameter('logLevel', logLevel);
			await allure.parameter('verbose', String(verbose));
			await allure.parameter('method', method);
			await allure.parameter('message', message);

			await allure.step(`Attempting to log message with ${method} method`, async (ctx) => {
				const logger = createMockLogger();
				await integrationLogger({ logLevel, logger, verbose }, message);
				ctx.parameter('Attempted logged message', message);
				expect(logger[method as keyof typeof logger]).not.toHaveBeenCalled();
			});
		});
	});

	[
		{
			logLevel: 'warn' as const,
			verbose: false,
			method: 'warn',
			message: 'Warn',
		},
		{
			logLevel: 'error' as const,
			verbose: false,
			method: 'error',
			message: 'Error',
		},
	].forEach(({ logLevel, verbose, method, message }) => {
		test(`${method} logs when verbose is false`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`integrationLogger - ${method} method`);
			await allure.tags(...sharedTags);
			await allure.parameter('logLevel', logLevel);
			await allure.parameter('verbose', String(verbose));
			await allure.parameter('method', method);
			await allure.parameter('message', message);

			await allure.step(`Logging message with ${method} method`, async (ctx) => {
				const logger = createMockLogger();
				await integrationLogger({ logLevel, logger, verbose }, message);
				ctx.parameter('Logged message', message);
				expect(logger[method as keyof typeof logger]).toHaveBeenCalledWith(message);
			});
		});
	});

	// pluginLogger tests
	[
		{
			id: 'astro-integration',
			expected: 'plugin:astro-integration',
		},
		{
			id: 'my-custom-plugin',
			expected: 'plugin:my-custom-plugin',
		},
		{
			id: 'test-plugin',
			expected: 'plugin:test-plugin',
		},
	].forEach(({ id, expected }) => {
		test(`pluginLogger forks logger with correct label for id "${id}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`pluginLogger - id: ${id}`);
			await allure.tags(...sharedTags);
			await allure.parameter('plugin id', id);
			await allure.parameter('expected label', expected);

			await allure.step(`Creating plugin logger for id "${id}"`, async (ctx) => {
				const baseLogger = createMockLogger();
				const forkSpy = vi.spyOn(baseLogger, 'fork');
				const myPluginLogger = pluginLogger(id, baseLogger);
				ctx.parameter('Forked label', expected);
				expect(forkSpy).toHaveBeenCalledWith(expected);
				expect(myPluginLogger).toBeDefined();
			});
		});
	});

	// logMessages tests
	test('logMessages - logs messages at various levels when verbose is true', async () => {
		const messages: Messages = [
			{ label: 'foo', logLevel: 'info', message: 'Info msg' },
			{ label: 'bar', logLevel: 'warn', message: 'Warn msg' },
			{ label: 'baz', logLevel: 'error', message: 'Error msg' },
			{ label: 'qux', logLevel: 'debug', message: 'Debug msg' },
		];
		const verbose = true;

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('logMessages - logs messages at various levels when verbose is true');
		await allure.tags(...sharedTags);
		await allure.parameter('verbose', String(verbose));
		await allure.parameter('messages', JSON.stringify(messages));

		await allure.step('Logging messages with logMessages utility', async (ctx) => {
			const logger = createMockLogger();
			ctx.parameter('Messages to log', JSON.stringify(messages));

			await logMessages(messages, { verbose }, logger);

			expect(logger.fork).toHaveBeenCalledWith('foo');
			expect(logger.fork).toHaveBeenCalledWith('bar');
			expect(logger.fork).toHaveBeenCalledWith('baz');
			expect(logger.fork).toHaveBeenCalledWith('qux');
		});
	});

	test('logMessages - Respects verbose flag', async () => {
		const messages: Messages = [
			{ label: 'foo', logLevel: 'info', message: 'Info msg' },
			{ label: 'bar', logLevel: 'warn', message: 'Warn msg' },
			{ label: 'baz', logLevel: 'error', message: 'Error msg' },
			{ label: 'qux', logLevel: 'debug', message: 'Debug msg' },
		];
		const verbose = false;

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('logMessages - Respects verbose flag');
		await allure.tags(...sharedTags);
		await allure.parameter('verbose', String(verbose));
		await allure.parameter('messages', JSON.stringify(messages));

		await allure.step('Logging messages with logMessages utility', async (ctx) => {
			const logger = createMockLogger();
			(logger.fork as Mock).mockReturnValue(logger);

			await logMessages(messages, { verbose }, logger);

			await ctx.parameter('Messages to log', JSON.stringify(messages));

			expect(logger.debug).not.toHaveBeenCalledWith('Debug msg');
			expect(logger.info).not.toHaveBeenCalledWith('Info msg');

			expect(logger.warn).toHaveBeenCalledWith('Warn msg');
			expect(logger.error).toHaveBeenCalledWith('Error msg');
		});
	});

	// getLatestVersion tests
	test('getLatestVersion - Fetches latest version and returns it', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - Fetches latest version and returns it');
		await allure.tags(...sharedTags);

		const mockArgs = {
			ok: true,
			json: async () => ({ version: '1.2.3' }),
		};
		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			undefined,
			false,
			mockFs,
		];
		const expectedVersion = '1.2.3';

		await allure.parameter('mock fetch args', JSON.stringify(mockArgs));
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));
		await allure.parameter('expected version', expectedVersion);

		await allure.step('Fetching latest version', async (ctx) => {
			mockFetch.mockResolvedValueOnce(mockArgs);

			const version = await getLatestVersion(...latestVersionArgs);
			await ctx.parameter('Fetched version', String(version));

			expect(version).toBe(expectedVersion);
			expect(mockLogger.error).not.toHaveBeenCalled();
			expect(mockFs.writeFileSync).not.toHaveBeenCalled();
		});
	});

	test('getLatestVersion - Returns cached version if dev mode and cache is fresh', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(
			'getLatestVersion - Returns cached version if dev mode and cache is fresh'
		);
		await allure.tags(...sharedTags);

		const now = Date.now();
		const lastChecked = new Date(now - 30 * 60 * 1000).toISOString(); // 30 min ago
		const mockArgs = JSON.stringify({
			latestVersionCheck: {
				lastChecked,
				version: '9.9.9',
			},
		});
		await allure.parameter('mock fetch args', JSON.stringify(mockArgs));

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			true,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedVersion = '9.9.9';
		await allure.parameter('expected version', expectedVersion);

		await allure.step('Retrieving cached version', async (ctx) => {
			mockFs.readFileSync.mockReturnValueOnce(mockArgs);

			const version = await getLatestVersion(...latestVersionArgs);
			await ctx.parameter('Cached version', String(version));

			expect(version).toBe(expectedVersion);
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	test('getLatestVersion - Fetches and updates cache if dev mode and cache is stale', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(
			'getLatestVersion - Fetches and updates cache if dev mode and cache is stale'
		);
		await allure.tags(...sharedTags);

		const now = Date.now();
		const lastChecked = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

		const mockFSArgs = JSON.stringify({
			latestVersionCheck: {
				lastChecked,
				version: '0.0.1',
			},
		});
		await allure.parameter('mock fs args', JSON.stringify(mockFSArgs));

		const mockFetchArgs = {
			ok: true,
			json: async () => ({ version: '2.0.0' }),
		};
		await allure.parameter('mock fetch args', JSON.stringify(mockFetchArgs));

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			true,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedVersion = '2.0.0';
		await allure.parameter('expected version', expectedVersion);

		await allure.step('Fetching and updating cache', async (ctx) => {
			mockFs.readFileSync.mockReturnValueOnce(mockFSArgs);
			mockFetch.mockResolvedValueOnce(mockFetchArgs);

			const version = await getLatestVersion(...latestVersionArgs);
			await ctx.parameter('Fetched version', String(version));

			expect(version).toBe(expectedVersion);
			expect(mockFs.writeFileSync).toHaveBeenCalled();
		});
	});

	test('getLatestVersion - Writes cache after fetching in dev mode', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - Writes cache after fetching in dev mode');
		await allure.tags(...sharedTags);

		const mockFSArgs = JSON.stringify({});
		await allure.parameter('mock fs args', JSON.stringify(mockFSArgs));

		const mockFetchArgs = {
			ok: true,
			json: async () => ({ version: '3.3.3' }),
		};
		await allure.parameter('mock fetch args', JSON.stringify(mockFetchArgs));

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			true,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedStringInCache = '"version": "3.3.3"';
		await allure.parameter('expected string in cache', expectedStringInCache);

		await allure.step('Writing cache after fetch', async (ctx) => {
			mockFs.readFileSync.mockReturnValueOnce(mockFSArgs);
			mockFetch.mockResolvedValueOnce(mockFetchArgs);

			await getLatestVersion(...latestVersionArgs);
			ctx.parameter('Cache write called', String(mockFs.writeFileSync.mock.calls.length));

			expect(mockFs.writeFileSync).toHaveBeenCalledWith(
				FAKE_URL,
				expect.stringContaining(expectedStringInCache),
				'utf-8'
			);
		});
	});

	test('getLatestVersion - Handles fetch errors gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - Handles fetch errors gracefully');
		await allure.tags(...sharedTags);

		await allure.parameter('fetch error', 'network error');

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			undefined,
			false,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedString = 'Error fetching latest version of test-package:';
		await allure.parameter('expected log message', expectedString);

		await allure.step('Handling fetch error', async (ctx) => {
			mockFetch.mockRejectedValueOnce(new Error('network error'));

			const version = await getLatestVersion(...latestVersionArgs);
			ctx.parameter('Returned version on fetch error', String(version));

			expect(version).toBeNull();
			expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(expectedString));
		});
	});

	test('getLatestVersion - Handles write errors gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - Handles write errors gracefully');
		await allure.tags(...sharedTags);

		const mockFsArgs = JSON.stringify({});
		await allure.parameter('mock fs args', JSON.stringify(mockFsArgs));

		const mockFetchArgs = {
			ok: true,
			json: async () => ({ version: '4.4.4' }),
		};
		await allure.parameter('mock fetch args', JSON.stringify(mockFetchArgs));

		await allure.parameter('write error', 'disk write error');

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			true,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedString = 'Error: disk write error';
		await allure.parameter('expected log message', expectedString);

		await allure.step('Handling write error', async (ctx) => {
			mockFs.readFileSync.mockReturnValueOnce(mockFsArgs);
			mockFetch.mockResolvedValueOnce(mockFetchArgs);
			mockFs.writeFileSync.mockImplementationOnce(() => {
				throw new Error('disk write error');
			});

			const version = await getLatestVersion(...latestVersionArgs);
			ctx.parameter('Returned version on write error', String(version));

			expect(version).toBe(null);
			expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(expectedString));
		});
	});

	test('getLatestVersion - Warns if cache read error is not ENOENT', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - Warns if cache read error is not ENOENT');
		await allure.tags(...sharedTags);

		await allure.parameter('read error', 'EACCES');

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			true,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedString = 'Ignoring cache read error for';
		await allure.parameter('expected log message', expectedString);

		await allure.step('Warning on cache read error', async () => {
			const error = new Error('Some parse error');
			// @ts-expect-error
			error.code = 'EACCES';
			mockFs.readFileSync.mockImplementationOnce(() => {
				throw error;
			});

			await getLatestVersion(...latestVersionArgs);

			expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining(expectedString));
		});
	});

	test('getLatestVersion - does not warn if cache read error is ENOENT', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - does not warn if cache read error is ENOENT');
		await allure.tags(...sharedTags);

		await allure.parameter('read error', 'ENOENT');

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			true,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		await allure.step('No warning on ENOENT cache read error', async () => {
			const error = new Error('File not found');
			// @ts-expect-error
			error.code = 'ENOENT';
			mockFs.readFileSync.mockImplementationOnce(() => {
				throw error;
			});

			await getLatestVersion(...latestVersionArgs);

			expect(mockLogger.warn).not.toHaveBeenCalled();
		});
	});

	test('getLatestVersion - returns null and warns if fetch response is not ok', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getLatestVersion - returns null and warns if fetch response is not ok');
		await allure.tags(...sharedTags);

		const mockFetchArgs = {
			ok: false,
			statusText: 'Not Found',
			json: vi.fn(),
		};
		await allure.parameter('mock fetch args', JSON.stringify(mockFetchArgs));

		const latestVersionArgs: Parameters<typeof getLatestVersion> = [
			'test-package',
			mockLogger,
			FAKE_URL,
			false,
			mockFs,
		];
		await allure.parameter('function args', JSON.stringify(latestVersionArgs));

		const expectedString = 'Failed to fetch package info from registry.npmjs.org: Not Found';
		await allure.parameter('expected log message', expectedString);

		await allure.step('Handling non-ok fetch response', async (ctx) => {
			mockFetch.mockResolvedValueOnce(mockFetchArgs);

			const version = await getLatestVersion(...latestVersionArgs);
			ctx.parameter('Returned version on non-ok fetch response', String(version));

			expect(version).toBeNull();
			expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining(expectedString));
		});
	});
});
