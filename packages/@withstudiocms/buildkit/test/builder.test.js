import * as child_process from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as allure from 'allure-js-commons';
import * as esbuild from 'esbuild';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest';
import builder from '../lib/cmds/builder.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

vi.mock('esbuild');
vi.mock('node:child_process');
vi.mock('node:fs/promises');
vi.mock('node:util', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		styleText: (_style, str) => str,
	};
});
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

describe(parentSuiteName, () => {
	const origConsoleLog = console.log;
	const origConsoleError = console.error;
	let logs = [];
	let errors = [];
	const cwd = process.cwd();
	let tmpDir;

	beforeAll(() => {
		tmpDir = mkdtempSync(path.join(os.tmpdir(), 'buildkit-cli-test-'));
		process.chdir(tmpDir);
		mkdirSync('src', { recursive: true });
		writeFileSync(path.join('src', 'index.ts'), 'export const foo: string = "bar";');
	});

	afterAll(() => {
		process.chdir(cwd);
		rmSync(tmpDir, { recursive: true, force: true });
		rmSync(path.join(cwd, 'dist'), { recursive: true, force: true });
	});

	beforeEach(() => {
		logs = [];
		errors = [];
		console.log = (msg) => logs.push(msg);
		console.error = (msg) => errors.push(msg);
		vi.clearAllMocks();

		esbuild.build = vi.fn().mockResolvedValue();
		esbuild.context = vi.fn().mockResolvedValue({
			watch: vi.fn(),
			stop: vi.fn(),
		});
	});

	afterEach(() => {
		console.log = origConsoleLog;
		console.error = origConsoleError;
	});

	[
		{
			name: 'Buildkit CLI - build command with no entry points',
			args: ['build', ['src/index.ts']],
			errorMessage: /No entry points found/,
			globResolveValue: false,
			fsResolveValues: undefined,
		},
		{
			name: 'Buildkit CLI - build command with entry point',
			args: ['build', ['src/index.ts', '--outdir=dist', '--tsconfig=tsconfig.json']],
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
					await builder(args[0], args[1]).catch(async (error) => {
						await ctx.parameter('Error Message', error.message);
						expect(error.message).toMatch(errorMessage);
					});
				} else {
					await builder(args[0], args[1]);
				}
			});

			if (!errorMessage) {
				await allure.step('Verify build output', async (ctx) => {
					const output = logs.join('\n');
					await ctx.parameter('CLI Output', output);
					expect(logs.some((l) => l.includes('Build Complete'))).toBe(true);
				});
			}
		});
	});

	[
		{
			name: 'Buildkit CLI - Dev command sets up watch',
			args: ['dev', ['src/index.ts', '--outdir=dist']],
			logsToContain: ['Watching for changes'],
		},
		{
			name: 'Buildkit CLI - build command with --no-clean-dist',
			args: ['build', ['src/index.ts', '--no-clean-dist']],
			logsToContain: ['Build Complete'],
		},
		{
			name: 'Buildkit CLI - build command with --force-cjs',
			args: ['build', ['src/index.ts', '--force-cjs', '--test-report']],
			logsToContain: ['OutExtension: {".js":".cjs"}', 'Format: cjs'],
		},
		{
			name: 'Buildkit CLI - build command with --bundle',
			args: ['build', ['src/index.ts', '--bundle', '--test-report']],
			logsToContain: ['Bundle: true', 'External: ["bar","foo"]'],
		},
	].forEach(({ name, args, logsToContain }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('CLI Tests');
			await allure.subSuite(name);
			await allure.tags(...sharedTags);
			await allure.parameter('Command Arguments', args.join(' '));
			await allure.parameter('Expected Logs', logsToContain.join(', '));

			const { glob } = await import('tinyglobby');
			glob.mockResolvedValueOnce([path.join(tmpDir, 'src/index.ts')]);
			fs.readFile.mockResolvedValueOnce(
				JSON.stringify({ type: 'module', dependencies: { foo: '^1.0.0', bar: '^2.0.0' } })
			);

			await allure.step('Run command', async () => {
				await builder(args[0], args[1]);
			});

			await allure.step('Verify build output', async (ctx) => {
				logsToContain.forEach(async (str) => {
					await ctx.parameter('Log to Find', str);
					expect(logs.some((l) => l.includes(str))).toBe(true);
				});
			});
		});
	});
});
