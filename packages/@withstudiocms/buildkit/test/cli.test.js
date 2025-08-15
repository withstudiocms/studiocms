import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import stripAnsi from 'strip-ansi';
import run from '../src/index.js';

let consoleLogSpy;
let originalArgv;

beforeEach(() => {
	originalArgv = process.argv;
	consoleLogSpy = {
		calls: [],
		fn: (...args) => {
			consoleLogSpy.calls.push(args);
		},
		restore: () => {
			console.log = originalConsoleLog;
		},
	};
	global.originalConsoleLog = console.log;
	console.log = consoleLogSpy.fn;
});

afterEach(() => {
	process.argv = originalArgv;
	consoleLogSpy.restore();
});

describe('buildkit CLI', () => {
	it('help command: should show help when no command is provided', async () => {
		process.argv = ['node', 'buildkit'];
		await run();

		assert.ok(consoleLogSpy.calls.length > 0);

		const output = consoleLogSpy.calls.map((call) => stripAnsi(call[0])).join('\n');

		assert.ok(output.includes('StudioCMS Buildkit'));
		assert.ok(output.includes('Usage:'));
		assert.ok(output.includes('Commands:'));
		assert.ok(output.includes('dev'));
		assert.ok(output.includes('build'));
		assert.ok(output.includes('test'));
		assert.ok(output.includes('Dev and Build Options:'));
		assert.ok(output.includes('--no-clean-dist'));
		assert.ok(output.includes('--bundle'));
		assert.ok(output.includes('--force-cjs'));
		assert.ok(output.includes('Test Options:'));
		assert.ok(output.includes('-m, --match <pattern>'));
		assert.ok(output.includes('-o, --only'));
		assert.ok(output.includes('-p, --parallel'));
		assert.ok(output.includes('-w, --watch'));
		assert.ok(output.includes('-t, --timeout <ms>'));
		assert.ok(output.includes('-s, --setup <file>'));
		assert.ok(output.includes('--teardown <file>'));
	});

	it('buildkit CLI: help command: should show help with invalid command', async () => {
		process.argv = ['node', 'buildkit', 'invalid-command'];
		await run();

		assert.ok(consoleLogSpy.calls.length > 0);

		const output = consoleLogSpy.calls.map((call) => stripAnsi(call[0])).join('\n');

		assert.ok(output.includes('StudioCMS Buildkit'));
		assert.ok(output.includes('Usage:'));
	});
});
