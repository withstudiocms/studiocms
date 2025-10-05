import type { AstroIntegrationLogger } from 'astro';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
	integrationLogger,
	logMessages,
	type Messages,
	pluginLogger,
} from '../../src/astro-integration/index.js';

function createMockLogger() {
	const logger: Record<string, any> = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		fork: vi.fn((label: string) => {
			// Each fork returns a new mock logger with the label attached for testing
			const forked = createMockLogger();
			forked.label = label;
			return forked;
		}),
	};
	return logger as unknown as AstroIntegrationLogger;
}

describe('integrationLogger', () => {
	let logger: AstroIntegrationLogger;

	beforeEach(() => {
		logger = createMockLogger();
	});

	it('logs message at specified logLevel when verbose is true', async () => {
		await integrationLogger({ logLevel: 'info', logger, verbose: true }, 'Test message');
		expect(logger.info).toHaveBeenCalledWith('Test message');
	});

	it('logs message at specified logLevel when verbose is undefined', async () => {
		await integrationLogger({ logLevel: 'warn', logger }, 'Warn message');
		expect(logger.warn).toHaveBeenCalledWith('Warn message');
	});

	it('does not log info/debug when verbose is false', async () => {
		await integrationLogger({ logLevel: 'info', logger, verbose: false }, 'Should not log');
		await integrationLogger({ logLevel: 'debug', logger, verbose: false }, 'Should not log');
		expect(logger.info).not.toHaveBeenCalled();
		expect(logger.debug).not.toHaveBeenCalled();
	});

	it('logs warn/error when verbose is false', async () => {
		await integrationLogger({ logLevel: 'warn', logger, verbose: false }, 'Warn');
		await integrationLogger({ logLevel: 'error', logger, verbose: false }, 'Error');
		expect(logger.warn).toHaveBeenCalledWith('Warn');
		expect(logger.error).toHaveBeenCalledWith('Error');
	});
});

describe('pluginLogger', () => {
	it('returns a forked logger with correct namespace', () => {
		const baseLogger = createMockLogger();
		const forkSpy = vi.spyOn(baseLogger, 'fork');
		const result = pluginLogger('my-plugin', baseLogger);
		expect(forkSpy).toHaveBeenCalledWith('plugin:my-plugin');
		expect(result).toBeDefined();
	});
});

describe('logMessages', () => {
	let logger: AstroIntegrationLogger;

	beforeEach(() => {
		logger = createMockLogger();
	});

	it('logs all messages with correct log levels and labels', async () => {
		const messages: Messages = [
			{ label: 'foo', logLevel: 'info', message: 'Info msg' },
			{ label: 'bar', logLevel: 'warn', message: 'Warn msg' },
			{ label: 'baz', logLevel: 'error', message: 'Error msg' },
			{ label: 'qux', logLevel: 'debug', message: 'Debug msg' },
		];

		await logMessages(messages, { verbose: true }, logger);

		// Each message should be logged with a forked logger
		expect(logger.fork).toHaveBeenCalledWith('foo');
		expect(logger.fork).toHaveBeenCalledWith('bar');
		expect(logger.fork).toHaveBeenCalledWith('baz');
		expect(logger.fork).toHaveBeenCalledWith('qux');
	});

	it('respects verbose flag for info messages', async () => {
		const infoLogger = createMockLogger();
		(logger.fork as Mock).mockReturnValue(infoLogger);

		const messages: Messages = [{ label: 'foo', logLevel: 'info', message: 'Info msg' }];

		await logMessages(messages, { verbose: false }, logger);
		expect(infoLogger.info).not.toHaveBeenCalled();

		await logMessages(messages, { verbose: true }, logger);
		expect(infoLogger.info).toHaveBeenCalledWith('Info msg');
	});

	it('always logs warn/error/debug regardless of verbose', async () => {
		const warnLogger = createMockLogger();
		const errorLogger = createMockLogger();
		const debugLogger = createMockLogger();

		(logger.fork as Mock)
			.mockImplementationOnce(() => warnLogger)
			.mockImplementationOnce(() => errorLogger)
			.mockImplementationOnce(() => debugLogger);

		const messages: Messages = [
			{ label: 'warn', logLevel: 'warn', message: 'Warn msg' },
			{ label: 'error', logLevel: 'error', message: 'Error msg' },
			{ label: 'debug', logLevel: 'debug', message: 'Debug msg' },
		];

		await logMessages(messages, { verbose: false }, logger);

		expect(warnLogger.warn).toHaveBeenCalledWith('Warn msg');
		expect(errorLogger.error).toHaveBeenCalledWith('Error msg');
		expect(debugLogger.debug).toHaveBeenCalledWith('Debug msg');
	});
});
