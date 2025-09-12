import * as child_process from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import * as esbuild from 'esbuild';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import builder from '../lib/cmds/builder.js';

vi.mock('esbuild');
vi.mock('node:child_process');
vi.mock('node:fs/promises');
vi.mock('chalk', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		dim: (str) => str,
		green: (str) => str,
		red: (str) => str,
		yellow: (str) => str,
		gray: (str) => str,
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

describe('builder', () => {
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

	it('throws if no entry points found', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([]);
		await expect(builder('build', ['src/index.ts'])).rejects.toThrow(/No entry points found/);
	});

	it('runs build with correct esbuild options', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([path.join(tmpDir, 'src/index.ts')]);
		fs.readFile.mockResolvedValueOnce(
			JSON.stringify({ type: 'module', dependencies: { foo: '^1.0.0' } })
		);

		const execFileSyncMock = vi.spyOn(child_process, 'execFileSync').mockReturnValue('');

		await builder('build', ['src/index.ts', '--outdir=dist', '--tsconfig=tsconfig.json']);

		expect(execFileSyncMock).toHaveBeenCalled();
		expect(logs.some((l) => l.includes('Build Complete'))).toBe(true);
	});

	it('runs dev and sets up watch', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([path.join(tmpDir, 'src/index.ts')]);
		fs.readFile.mockResolvedValueOnce(JSON.stringify({ type: 'module', dependencies: {} }));

		await builder('dev', ['src/index.ts', '--outdir=dist']);

		expect(logs.some((l) => l.includes('Watching for changes'))).toBe(true);
	});

	it('skips cleaning if --no-clean-dist is passed', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([path.join(tmpDir, 'src/index.ts')]);
		fs.readFile.mockResolvedValueOnce(JSON.stringify({ type: 'module', dependencies: {} }));

		await builder('build', ['src/index.ts', '--no-clean-dist']);

		expect(logs.some((l) => l.includes('Build Complete'))).toBe(true);
	});

	it('uses cjs format if --force-cjs is passed', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([path.join(tmpDir, 'src/index.ts')]);
		fs.readFile.mockResolvedValueOnce(JSON.stringify({ type: 'module', dependencies: {} }));

		await builder('build', ['src/index.ts', '--force-cjs', '--test-report']);

		expect(logs.some((l) => l.includes('OutExtension: {".js":".cjs"}'))).toBe(true);
		expect(logs.some((l) => l.includes('Format: cjs'))).toBe(true);
	});

	it('passes bundle and external dependencies if --bundle is passed', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([path.join(tmpDir, 'src/index.ts')]);
		fs.readFile.mockResolvedValueOnce(
			JSON.stringify({ type: 'module', dependencies: { foo: '^1.0.0', bar: '^2.0.0' } })
		);

		await builder('build', ['src/index.ts', '--bundle', '--test-report']);

		expect(logs.some((l) => l.includes('Bundle: true'))).toBe(true);
		expect(logs.some((l) => l.includes('External: ["bar","foo"]\n'))).toBe(true);
	});
});
