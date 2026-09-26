import * as child_process from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as allure from 'allure-js-commons';
import stripAnsi from 'strip-ansi';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import run from '../lib/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

vi.mock('tinyglobby', () => ({
	glob: vi.fn(async (patterns, _opts) => {
		if (Array.isArray(patterns)) {
			// Simulate globbing for entry points and cleaning
			return patterns
				.filter((p) => typeof p === 'string' && !p.startsWith('!'))
				.map((p) => p.replace(/^\.\//, ''));
		}
		return [];
	}),
}));
vi.mock('node:fs/promises');
vi.mock('node:child_process');

let originalArgv;
let consoleLogSpy;

beforeEach(() => {
	originalArgv = process.argv.slice();
	consoleLogSpy = vi.fn();
	vi.stubGlobal('console', { ...console, log: consoleLogSpy });
});

afterEach(() => {
	process.argv = originalArgv;
	vi.unstubAllGlobals();
});

describe(parentSuiteName, () => {
	const cwd = process.cwd();
	let tmpDir;

	beforeAll(() => {
		tmpDir = mkdtempSync(path.join(os.tmpdir(), 'buildkit-cli-test-'));
		process.chdir(tmpDir);
		mkdirSync('src', { recursive: true });
		writeFileSync(path.join('src', 'index.ts'), 'export const foo = "bar";');
	});

	afterAll(() => {
		process.chdir(cwd);
		rmSync(tmpDir, { recursive: true, force: true });
	});

	[
		{
			name: 'Buildkit CLI - help command',
			args: ['node', 'buildkit'],
			toContain: [
				'StudioCMS Buildkit',
				'Usage:',
				'Commands:',
				'dev',
				'build',
				'Dev and Build Options:',
				'--no-clean-dist',
				'--bundle',
				'--force-cjs',
			],
		},
		{
			name: 'Buildkit CLI - help command with invalid command',
			args: ['node', 'buildkit', 'invalid-command'],
			toContain: ['StudioCMS Buildkit', 'Usage:'],
		},
	].forEach(({ name, args, toContain }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('CLI Tests');
			await allure.subSuite(name);
			await allure.tags(...sharedTags);

			await allure.step('Run command', async (ctx) => {
				process.argv = args;
				await ctx.parameter('Command Arguments', args.join(' '));
				await run();
			});

			await allure.step('Verify help output', async (ctx) => {
				const output = consoleLogSpy.mock.calls.map((call) => stripAnsi(call[0])).join('\n');

				await ctx.parameter('CLI Output', output);

				toContain.forEach((str) => {
					expect(output).toContain(str);
				});
			});
		});
	});

	[
		{
			name: 'Buildkit CLI - build command with no entry points',
			args: ['node', 'buildkit', 'build', 'src/index.ts'],
			errorMessage: /No entry points found/,
			globResolveValue: false,
			fsResolveValues: undefined,
		},
		{
			name: 'Buildkit CLI - build command with entry point',
			args: [
				'node',
				'buildkit',
				'build',
				'src/index.ts',
				'--outdir=dist',
				'--tsconfig=tsconfig.json',
			],
			errorMessage: null,
			globResolveValue: true,
			fsResolveValues: [JSON.stringify({ type: 'module', dependencies: { foo: '^1.0.0' } })],
		},
	].forEach(({ name, args, errorMessage, globResolveValue, fsResolveValues }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('CLI Tests');
			await allure.subSuite(name);
			await allure.tags(...sharedTags);

			const { glob } = await import('tinyglobby');
			glob.mockResolvedValueOnce(globResolveValue ? path.join(tmpDir, 'src/index.ts') : []);
			if (fsResolveValues) {
				fs.readFile.mockResolvedValueOnce(fsResolveValues[0]);
			}

			await allure.step('Run command', async (ctx) => {
				process.argv = args;
				await ctx.parameter('Command Arguments', args.join(' '));
				if (errorMessage) {
					await run().catch(async (error) => {
						await ctx.parameter('Error Message', error.message);
						expect(error.message).toMatch(errorMessage);
					});
				} else {
					await run();
				}
			});

			if (!errorMessage) {
				await allure.step('Verify build output', async (ctx) => {
					const output = consoleLogSpy.mock.calls.map((call) => stripAnsi(call[0])).join('\n');
					await ctx.parameter('CLI Output', output);
					expect(consoleLogSpy.mock.calls.some((call) => call[0].includes('Build Complete'))).toBe(
						true
					);
				});
			}
		});
	});
});
