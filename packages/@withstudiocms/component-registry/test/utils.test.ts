import type { AstroIntegrationLogger } from 'astro';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	convertHyphensToUnderscores,
	convertUnderscoresToHyphens,
	dedent,
	getIndent,
	integrationLogger,
} from '../src/utils.js';

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

describe('String Utilities', () => {
	describe('convertHyphensToUnderscores', () => {
		it('should convert single hyphen to underscore', () => {
			const result = convertHyphensToUnderscores('hello-world');
			expect(result).toBe('hello_world');
		});

		it('should convert multiple hyphens to underscores', () => {
			const result = convertHyphensToUnderscores('hello-world-test-case');
			expect(result).toBe('hello_world_test_case');
		});

		it('should handle consecutive hyphens', () => {
			const result = convertHyphensToUnderscores('hello--world');
			expect(result).toBe('hello__world');
		});

		it('should handle hyphens at the beginning and end', () => {
			const result = convertHyphensToUnderscores('-hello-world-');
			expect(result).toBe('_hello_world_');
		});

		it('should handle empty string', () => {
			const result = convertHyphensToUnderscores('');
			expect(result).toBe('');
		});

		it('should handle string with no hyphens', () => {
			const result = convertHyphensToUnderscores('helloworld');
			expect(result).toBe('helloworld');
		});

		it('should handle string with only hyphens', () => {
			const result = convertHyphensToUnderscores('---');
			expect(result).toBe('___');
		});
	});

	describe('convertUnderscoresToHyphens', () => {
		it('should convert single underscore to hyphen', () => {
			const result = convertUnderscoresToHyphens('hello_world');
			expect(result).toBe('hello-world');
		});

		it('should convert multiple underscores to hyphens', () => {
			const result = convertUnderscoresToHyphens('hello_world_test_case');
			expect(result).toBe('hello-world-test-case');
		});

		it('should handle consecutive underscores', () => {
			const result = convertUnderscoresToHyphens('hello__world');
			expect(result).toBe('hello--world');
		});

		it('should handle underscores at the beginning and end', () => {
			const result = convertUnderscoresToHyphens('_hello_world_');
			expect(result).toBe('-hello-world-');
		});

		it('should handle empty string', () => {
			const result = convertUnderscoresToHyphens('');
			expect(result).toBe('');
		});

		it('should handle string with no underscores', () => {
			const result = convertUnderscoresToHyphens('helloworld');
			expect(result).toBe('helloworld');
		});

		it('should handle string with only underscores', () => {
			const result = convertUnderscoresToHyphens('___');
			expect(result).toBe('---');
		});
	});

	describe('getIndent', () => {
		it('should return spaces for space-indented line', () => {
			const result = getIndent('    hello world');
			expect(result).toBe('    ');
		});

		it('should return tabs for tab-indented line', () => {
			const result = getIndent('\t\thello world');
			expect(result).toBe('\t\t');
		});

		it('should return mixed whitespace', () => {
			const result = getIndent('  \t hello world');
			expect(result).toBe('  \t ');
		});

		it('should return empty string for non-indented line', () => {
			const result = getIndent('hello world');
			expect(result).toBe('');
		});

		it('should return empty string for empty string', () => {
			const result = getIndent('');
			expect(result).toBe('');
		});

		it('should return whitespace for line with only whitespace', () => {
			const result = getIndent('   ');
			expect(result).toBe('   ');
		});

		it('should handle line with leading and trailing whitespace', () => {
			const result = getIndent('  hello world  ');
			expect(result).toBe('  ');
		});
	});

	describe('dedent', () => {
		it('should remove common indentation from multi-line string', () => {
			const input = `    line 1
    line 2
    line 3`;
			const expected = `line 1
line 2
line 3`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle mixed indentation levels', () => {
			const input = `    line 1
        line 2
    line 3`;
			const expected = `line 1
    line 2
line 3`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle tab indentation', () => {
			const input = `\tline 1
\tline 2
\tline 3`;
			const expected = `line 1
line 2
line 3`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle empty first line', () => {
			const input = `
    line 1
    line 2`;
			const expected = `line 1
line 2`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle leading newlines', () => {
			const input = `\n\n    line 1
    line 2`;
			const expected = `line 1
line 2`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle single line with indentation', () => {
			const input = '    hello world';
			const expected = 'hello world';
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle no indentation', () => {
			const input = `line 1
line 2
line 3`;
			const expected = `line 1
line 2
line 3`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});

		it('should handle empty string', () => {
			const result = dedent('');
			expect(result).toBe('');
		});

		it('should handle only whitespace lines', () => {
			const input = `
    line 2
    line 3`;
			const expected = `line 2
line 3`;
			const result = dedent(input);
			expect(result).toBe(expected);
		});
	});

	describe('integration tests', () => {
		it('should convert hyphens to underscores and back', () => {
			const original = 'hello-world-test';
			const withUnderscores = convertHyphensToUnderscores(original);
			const backToHyphens = convertUnderscoresToHyphens(withUnderscores);
			expect(backToHyphens).toBe(original);
		});

		it('should convert underscores to hyphens and back', () => {
			const original = 'hello_world_test';
			const withHyphens = convertUnderscoresToHyphens(original);
			const backToUnderscores = convertHyphensToUnderscores(withHyphens);
			expect(backToUnderscores).toBe(original);
		});

		it('should work with dedent on indented code with hyphens', () => {
			const input = `    const hello-world = 'test';
    const foo-bar = 'value';`;
			const dedented = dedent(input);
			const converted = convertHyphensToUnderscores(dedented);
			const expected = `const hello_world = 'test';
const foo_bar = 'value';`;
			expect(converted).toBe(expected);
		});
	});
});
