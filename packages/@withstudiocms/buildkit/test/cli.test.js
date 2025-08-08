import stripAnsi from 'strip-ansi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import run from '../index.js';

describe('buildkit CLI', () => {
	let consoleLogSpy;
	let originalArgv;

	beforeEach(() => {
		originalArgv = process.argv;
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		process.argv = originalArgv;
		consoleLogSpy.mockRestore();
	});

	describe('help command', () => {
		it('should show help when no command is provided', async () => {
			// Set up process.argv for no command
			process.argv = ['node', 'buildkit'];

			// Run the CLI
			await run();

			expect(consoleLogSpy).toHaveBeenCalled();

			// Get all console.log calls combined
			const output = consoleLogSpy.mock.calls.map((call) => stripAnsi(call[0])).join('\n');

			// Verify help content
			expect(output).toContain('StudioCMS Buildkit');
			expect(output).toContain('Usage:');
			expect(output).toContain('Commands:');
			expect(output).toContain('dev');
			expect(output).toContain('build');
			expect(output).toContain('test');
			expect(output).toContain('Dev and Build Options:');
			expect(output).toContain('--no-clean-dist');
			expect(output).toContain('--bundle');
			expect(output).toContain('--force-cjs');
			expect(output).toContain('Test Options:');
			expect(output).toContain('-m, --match <pattern>');
			expect(output).toContain('-o, --only');
			expect(output).toContain('-p, --parallel');
			expect(output).toContain('-w, --watch');
			expect(output).toContain('-t, --timeout <ms>');
			expect(output).toContain('-s, --setup <file>');
			expect(output).toContain('--teardown <file>');
		});

		it('should show help with invalid command', async () => {
			// Set up process.argv with invalid command
			process.argv = ['node', 'buildkit', 'invalid-command'];

			// Run the CLI
			await run();

			expect(consoleLogSpy).toHaveBeenCalled();

			// Get all console.log calls combined
			const output = consoleLogSpy.mock.calls.map((call) => stripAnsi(call[0])).join('\n');

			// Verify help content
			expect(output).toContain('StudioCMS Buildkit');
			expect(output).toContain('Usage:');
		});
	});
});
