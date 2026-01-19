import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	commandExists,
	exists,
	pathToFileURL,
	resolveRoot,
	runInteractiveCommand,
	shell,
} from '../src/utils';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Utils Module Tests';

vi.mock('node:child_process');
vi.mock('node:fs');

describe(parentSuiteName, () => {
	const originalPlatform = process.platform;
	const originalCwd = process.cwd();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		Object.defineProperty(process, 'platform', {
			value: originalPlatform,
		});
		vi.spyOn(process, 'cwd').mockReturnValue(originalCwd);
	});

	test('shell - should execute command successfully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('shell Tests');
		await allure.tags(...sharedTags);

		const mockChild = {
			stdout: {
				[Symbol.asyncIterator]: async function* () {
					yield 'output';
				},
			},
			stderr: {
				[Symbol.asyncIterator]: async function* () {
					yield '';
				},
			},
			exitCode: 0,
			on: vi.fn((event, callback) => {
				if (event === 'close') {
					setTimeout(() => callback(), 0);
				}
				return mockChild;
			}),
		};

		vi.mocked(spawn).mockReturnValue(mockChild as any);

		await allure.step('Running shell command', async (ctx) => {
			const result = await shell('echo', ['test']);
			await ctx.parameter('Exit Code', String(result.exitCode));

			expect(result.exitCode).toBe(0);
		});
	});

	test('shell - should handle command error', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('shell Tests');
		await allure.tags(...sharedTags);

		const mockChild = {
			stdout: {
				[Symbol.asyncIterator]: async function* () {
					yield '';
				},
			},
			stderr: {
				[Symbol.asyncIterator]: async function* () {
					yield 'error message';
				},
			},
			exitCode: 1,
			on: vi.fn((event, callback) => {
				if (event === 'close') {
					setTimeout(() => callback(), 0);
				}
				return mockChild;
			}),
		};

		vi.mocked(spawn).mockReturnValue(mockChild as any);

		await allure.step('Running shell command that errors', async (ctx) => {
			try {
				await shell('invalid', ['command']);
			} catch (error) {
				await ctx.parameter('Error Message', (error as Error).message);
				expect((error as Error).message).toContain('error message');
			}
		});
	});

	test('shell - should throw timeout error when exitCode is null', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('shell Tests');
		await allure.tags(...sharedTags);

		const mockChild = {
			stdout: {
				[Symbol.asyncIterator]: async function* () {
					yield '';
				},
			},
			stderr: {
				[Symbol.asyncIterator]: async function* () {
					yield '';
				},
			},
			exitCode: null,
			on: vi.fn((event, callback) => {
				if (event === 'close') {
					setTimeout(() => callback(), 0);
				}
				return mockChild;
			}),
		};

		vi.mocked(spawn).mockReturnValue(mockChild as any);

		await allure.step('Running shell command that times out', async (ctx) => {
			try {
				await shell('timeout', ['command'], { timeout: 100 });
			} catch (error) {
				await ctx.parameter('Error Message', (error as Error).message);
				expect((error as Error).message).toBe('Timeout');
			}
		});
	});

	[
		{
			name: 'commandExists - should return true for existing command',
			mockStatus: 0,
			command: 'node',
			expected: true,
			toHaveBeenCalledWith: ['node', ['--version'], { stdio: 'ignore', shell: true }],
		},
		{
			name: 'commandExists - should return false for non-existing command',
			mockStatus: 1,
			command: 'nonexistent',
			expected: false,
			toHaveBeenCalledWith: ['nonexistent', ['--version'], { stdio: 'ignore', shell: true }],
		},
	].forEach(({ name, mockStatus, command, expected, toHaveBeenCalledWith }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('commandExists Tests');
			await allure.tags(...sharedTags);

			vi.mocked(spawnSync).mockReturnValue({ status: mockStatus } as any);

			await allure.step(`Checking if command "${command}" exists`, async (ctx) => {
				const result = commandExists(command);
				await ctx.parameter('Command', command);
				await ctx.parameter('Result', String(result));

				expect(result).toBe(expected);
				expect(spawnSync).toHaveBeenCalledWith(...toHaveBeenCalledWith);
			});
		});
	});

	[
		{
			name: 'exists - should return true for existing path',
			mockImplementation: () => ({}) as any,
			input: '/existing/path',
			expected: true,
		},
		{
			name: 'exists - should return false for non-existing path',
			mockImplementation: () => {
				throw new Error('ENOENT');
			},
			input: '/non/existing/path',
			expected: false,
		},
		{
			name: 'exists - should return false for undefined path',
			mockImplementation: undefined,
			input: undefined,
			expected: false,
		},
		{
			name: 'exists - should handle URL paths',
			mockImplementation: () => ({}) as any,
			input: new URL('file:///existing/path'),
			expected: true,
		},
	].forEach(({ name, mockImplementation, input, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('exists Tests');
			await allure.tags(...sharedTags);

			if (mockImplementation) {
				vi.mocked(fs.statSync).mockImplementation(mockImplementation);
			}

			await allure.step(`Checking if path "${String(input)}" exists`, async (ctx) => {
				const result = exists(input);
				await ctx.parameter('Path', String(input));
				await ctx.parameter('Result', String(result));

				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			name: 'runInteractiveCommand - should resolve on successful command execution',
			mockProcess: {
				on: vi.fn((event, callback) => {
					if (event === 'close') callback(0);
					return this;
				}),
			},
			command: 'echo test',
			expectedError: undefined,
		},
		{
			name: 'runInteractiveCommand - should reject on non-zero exit code',
			mockProcess: {
				on: vi.fn((event, callback) => {
					if (event === 'close') callback(1);
					return this;
				}),
			},
			command: 'invalid',
			expectedError: 'Command exited with code 1',
		},
		{
			name: 'runInteractiveCommand - should reject on process error',
			mockProcess: {
				on: vi.fn((event, callback) => {
					if (event === 'error') callback(new Error('spawn error'));
					return this;
				}),
			},
			command: 'invalid',
			expectedError: 'spawn error',
		},
	].forEach(({ name, mockProcess, command, expectedError }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('runInteractiveCommand Tests');
			await allure.tags(...sharedTags);

			vi.mocked(spawn).mockReturnValue(mockProcess as any);

			await allure.step(`Running interactive command "${command}"`, async (ctx) => {
				try {
					await runInteractiveCommand(command);
					if (expectedError) {
						throw new Error('Expected command to fail, but it succeeded');
					}
					await ctx.parameter('Result', 'Command completed successfully');
				} catch (error) {
					await ctx.parameter('Error Message', (error as Error).message);
					if (expectedError) {
						expect((error as Error).message).toBe(expectedError);
					} else {
						throw error;
					}
				}
			});
		});
	});

	[
		{
			name: 'resolveRoot - should resolve string path',
			input: '/home/user/project',
			expected: path.resolve('/home/user/project'),
		},
		{
			name: 'resolveRoot - should resolve URL path',
			input: new URL('file:///home/user/project'),
			expectedContains: 'home',
		},
		{
			name: 'resolveRoot - should use process.cwd() when no path provided',
			input: undefined,
			mockCwd: '/mock/cwd',
			expected: '/mock/cwd',
		},
	].forEach(({ name, input, expected, expectedContains, mockCwd }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('resolveRoot Tests');
			await allure.tags(...sharedTags);

			if (mockCwd) {
				vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);
			}

			await allure.step(`Resolving root for input "${String(input)}"`, async (ctx) => {
				const result = resolveRoot(input);
				await ctx.parameter('Input', String(input));
				await ctx.parameter('Result', result);

				if (expected !== undefined) {
					expect(result).toBe(expected);
				} else if (expectedContains !== undefined) {
					expect(result).toContain(expectedContains);
				}
			});
		});
	});

	[
		{
			name: 'pathToFileURL - should convert Unix path to file URL',
			platformValue: 'linux',
			input: '/home/user/file.txt',
			expectedPathname: '/home/user/file.txt',
			expectedProtocol: 'file:',
		},
		{
			name: 'pathToFileURL - should convert Windows path to file URL',
			platformValue: 'win32',
			input: 'C:\\Users\\file.txt',
			expectedPathnameContains: '/C:/Users/file.txt',
			expectedProtocol: 'file:',
		},
	].forEach(
		({
			name,
			platformValue,
			input,
			expectedPathname,
			expectedPathnameContains,
			expectedProtocol,
		}) => {
			test(name, async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite(localSuiteName);
				await allure.subSuite('pathToFileURL Tests');
				await allure.tags(...sharedTags);

				Object.defineProperty(process, 'platform', { value: platformValue });

				await allure.step(`Converting path "${input}" to file URL`, async (ctx) => {
					const result = pathToFileURL(input);
					await ctx.parameter('Input Path', input);
					await ctx.parameter('Result URL', result.href);

					expect(result.protocol).toBe(expectedProtocol);
					if (expectedPathname !== undefined) {
						expect(result.pathname).toBe(expectedPathname);
					} else if (expectedPathnameContains !== undefined) {
						expect(result.pathname).toContain(expectedPathnameContains);
					}
				});
			});
		}
	);
});
