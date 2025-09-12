import * as child_process from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import stripAnsi from 'strip-ansi';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import run from '../lib/index.js';

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

describe('buildkit CLI', () => {
	beforeAll(() => {
		mkdirSync('src', { recursive: true });
		writeFileSync(path.join('src', 'index.ts'), 'export const foo = "bar";');
	});

	afterAll(() => {
		rmSync('src', { recursive: true, force: true });
		rmSync('dist', { recursive: true, force: true });
	});
	it('help command: should show help when no command is provided', async () => {
		process.argv = ['node', 'buildkit'];
		await run();

		expect(consoleLogSpy).toHaveBeenCalled();

		const output = consoleLogSpy.mock.calls.map((call) => stripAnsi(call[0])).join('\n');

		expect(output).toContain('StudioCMS Buildkit');
		expect(output).toContain('Usage:');
		expect(output).toContain('Commands:');
		expect(output).toContain('dev');
		expect(output).toContain('build');
		expect(output).toContain('Dev and Build Options:');
		expect(output).toContain('--no-clean-dist');
		expect(output).toContain('--bundle');
		expect(output).toContain('--force-cjs');
	});

	it('buildkit CLI: help command: should show help with invalid command', async () => {
		process.argv = ['node', 'buildkit', 'invalid-command'];
		await run();

		expect(consoleLogSpy).toHaveBeenCalled();

		const output = consoleLogSpy.mock.calls.map((call) => stripAnsi(call[0])).join('\n');

		expect(output).toContain('StudioCMS Buildkit');
		expect(output).toContain('Usage:');
	});

	it('throws if no entry points found', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce([]);
		process.argv = ['node', 'buildkit', 'build', 'src/index.ts'];
		await run().catch((error) => {
			expect(error.message).toMatch(/No entry points found/);
		});
	});

	it('runs build with correct esbuild options', async () => {
		const { glob } = await import('tinyglobby');
		glob.mockResolvedValueOnce(['src/index.ts']);
		fs.readFile.mockResolvedValueOnce(
			JSON.stringify({ type: 'module', dependencies: { foo: '^1.0.0' } })
		);

		const execFileSyncMock = vi.spyOn(child_process, 'execFileSync').mockReturnValue('');

		process.argv = [
			'node',
			'buildkit',
			'build',
			'src/index.ts',
			'--outdir=dist',
			'--tsconfig=tsconfig.json',
		];
		await run();

		expect(execFileSyncMock).toHaveBeenCalled();
		expect(consoleLogSpy.mock.calls.some((call) => call[0].includes('Build Complete'))).toBe(true);
	});
});
