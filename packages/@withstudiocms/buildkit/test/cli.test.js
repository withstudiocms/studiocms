import stripAnsi from 'strip-ansi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import run from '../lib/index.js';

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
});
