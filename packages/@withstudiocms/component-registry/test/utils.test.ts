import * as allure from 'allure-js-commons';
import type { AstroIntegrationLogger } from 'astro';
import { describe, expect, test } from 'vitest';
import {
	convertHyphensToUnderscores,
	convertUnderscoresToHyphens,
	dedent,
	getIndent,
	integrationLogger,
} from '../src/utils.js';
import { createMockLogger, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Utility Tests';

describe(parentSuiteName, () => {
	[
		{ logLevel: 'info' as const, verbose: true, method: 'info' },
		{ logLevel: 'warn' as const, verbose: true, method: 'warn' },
		{ logLevel: 'error' as const, verbose: true, method: 'error' },
		{ logLevel: 'debug' as const, verbose: true, method: 'debug' },
	].forEach(({ logLevel, verbose, method }) => {
		test(`Utility - integrationLogger logs at ${logLevel} when verbose is true`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('integrationLogger Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('logLevel', logLevel);
			await allure.parameter('verbose', String(verbose));

			const logger = createMockLogger();

			await allure.step(`Should log message at ${logLevel}`, async (ctx) => {
				const message = `Test message at ${logLevel}`;
				await integrationLogger({ logLevel, logger, verbose }, message);
				await ctx.parameter('message', message);
				expect(logger[method as keyof AstroIntegrationLogger]).toHaveBeenCalledWith(message);
			});
		});
	});

	[
		{ logLevel: 'info' as const, verbose: false, method: 'info' },
		{ logLevel: 'warn' as const, verbose: false, method: 'warn' },
		{ logLevel: 'error' as const, verbose: false, method: 'error' },
		{ logLevel: 'debug' as const, verbose: false, method: 'debug' },
		{ logLevel: 'info' as const, verbose: undefined, method: 'info' },
		{ logLevel: 'warn' as const, verbose: undefined, method: 'warn' },
		{ logLevel: 'error' as const, verbose: undefined, method: 'error' },
		{ logLevel: 'debug' as const, verbose: undefined, method: 'debug' },
	].forEach(({ logLevel, verbose, method }) => {
		test(`Utility - integrationLogger does not log info/debug when verbose is false for logLevel ${logLevel}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('integrationLogger Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('logLevel', logLevel);
			await allure.parameter('verbose', String(verbose));

			const logger = createMockLogger();

			await allure.step(`Should not log info/debug at ${logLevel}`, async (ctx) => {
				const message = `Test message at ${logLevel}`;
				await integrationLogger({ logLevel, logger, verbose }, message);
				await ctx.parameter('message', message);
				if (method === 'info' || method === 'debug') {
					expect(logger[method as keyof AstroIntegrationLogger]).not.toHaveBeenCalled();
				} else {
					expect(logger[method as keyof AstroIntegrationLogger]).toHaveBeenCalledWith(message);
				}
			});
		});
	});

	[
		{ input: 'hello-world', expected: 'hello_world' },
		{ input: 'hello-world-test-case', expected: 'hello_world_test_case' },
		{ input: 'hello--world', expected: 'hello__world' },
		{ input: '-hello-world-', expected: '_hello_world_' },
		{ input: '', expected: '' },
		{ input: 'helloworld', expected: 'helloworld' },
		{ input: '---', expected: '___' },
	].forEach(({ input, expected }) => {
		test(`Utility - convertHyphensToUnderscores converts "${input}" to "${expected}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('convertHyphensToUnderscores Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Should convert hyphens to underscores', async () => {
				const result = convertHyphensToUnderscores(input);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{ input: 'hello_world', expected: 'hello-world' },
		{ input: 'hello_world_test_case', expected: 'hello-world-test-case' },
		{ input: 'hello__world', expected: 'hello--world' },
		{ input: '_hello_world_', expected: '-hello-world-' },
		{ input: '', expected: '' },
		{ input: 'helloworld', expected: 'helloworld' },
		{ input: '___', expected: '---' },
	].forEach(({ input, expected }) => {
		test(`Utility - convertUnderscoresToHyphens converts "${input}" to "${expected}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('convertUnderscoresToHyphens Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Should convert underscores to hyphens', async () => {
				const result = convertUnderscoresToHyphens(input);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			original: 'hello-world-test',
			direction: 'toUnderscores' as const,
			midway: 'hello_world_test',
		},
		{
			original: 'hello_world_test',
			direction: 'toHyphens' as const,
			midway: 'hello-world-test',
		},
	].forEach(({ original, direction, midway }) => {
		test(`Utility - round-trip conversion of "${original}" ${direction}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Round-Trip Conversion Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('original', original);
			await allure.parameter('direction', direction);

			await allure.step(`Should round-trip convert "${original}"`, async (ctx) => {
				let converted: string;
				let roundTripped: string;
				if (direction === 'toUnderscores') {
					converted = convertHyphensToUnderscores(original);
					roundTripped = convertUnderscoresToHyphens(converted);
				} else {
					converted = convertUnderscoresToHyphens(original);
					roundTripped = convertHyphensToUnderscores(converted);
				}

				await ctx.parameter('converted', converted);
				await ctx.parameter('roundTripped', roundTripped);

				expect(converted).toBe(midway);
				expect(roundTripped).toBe(original);
			});
		});
	});

	[
		{ input: '    hello world', expected: '    ' },
		{ input: '\t\thello world', expected: '\t\t' },
		{ input: '  \t hello world', expected: '  \t ' },
		{ input: 'hello world', expected: '' },
		{ input: '   ', expected: '   ' },
		{ input: '', expected: '' },
		{ input: '  hello world  ', expected: '  ' },
	].forEach(({ input, expected }) => {
		test(`Utility - getIndent returns "${expected}" for input "${input}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getIndent Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Should get correct indentation', async () => {
				const result = getIndent(input);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: `    line 1
    line 2
    line 3`,
			expected: `line 1
line 2
line 3`,
		},
		{
			input: `    line 1
        line 2
    line 3`,
			expected: `line 1
    line 2
line 3`,
		},
		{
			input: `\tline 1
\tline 2
\tline 3`,
			expected: `line 1
line 2
line 3`,
		},
		{
			input: `
    line 1
    line 2`,
			expected: `line 1
line 2`,
		},
		{
			input: `\n\n    line 1
    line 2`,
			expected: `line 1
line 2`,
		},
		{
			input: '    hello world',
			expected: 'hello world',
		},
		{
			input: `line 1
line 2
line 3`,
			expected: `line 1
line 2
line 3`,
		},
		{
			input: '',
			expected: '',
		},
		{
			input: `
    line 2
    line 3`,
			expected: `line 2
line 3`,
		},
	].forEach(({ input, expected }) => {
		test('Utility - dedent correctly dedents input', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('dedent Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Should dedent correctly', async () => {
				const result = dedent(input);
				expect(result).toBe(expected);
			});
		});
	});

	test('Utility - Integration test - dedent and convertHyphensToUnderscores', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Test - dedent and convertHyphensToUnderscores');
		await allure.tags(...sharedTags);

		const input = `\tconst hello-world = 'test';\nconst foo-bar = 'value';`;
		const expected = `const hello_world = 'test';\nconst foo_bar = 'value';`;

		await allure.parameter('input', input);
		await allure.parameter('expected', expected);

		await allure.step('Should dedent and convert hyphens to underscores', async (ctx) => {
			await ctx.parameter('input', input);
			await ctx.parameter('expected', expected);

			const dedented = dedent(input);
			await ctx.parameter('dedented', dedented);

			const converted = convertHyphensToUnderscores(dedented);
			await ctx.parameter('converted', converted);

			expect(converted).toBe(expected);
		});
	});
});
