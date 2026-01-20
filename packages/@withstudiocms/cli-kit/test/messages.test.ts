import * as allure from 'allure-js-commons';
import stripAnsi from 'strip-ansi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	action,
	boxen,
	cancelled,
	cancelMessage,
	createClackMessageUpdate,
	date,
	dt,
	getName,
	label,
	randomBetween,
	setStdout,
	sleep,
	success,
} from '../src/messages.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Messages Utility Tests';

describe(parentSuiteName, () => {
	let originalStdout: typeof process.stdout;
	let mockStream: any;

	beforeEach(() => {
		originalStdout = process.stdout;
		mockStream = {
			write: vi.fn(),
			columns: 80,
			rows: 24,
		};
	});

	afterEach(() => {
		setStdout(originalStdout);
	});

	test('dt (DateTimeFormat) - should format time in 12-hour format', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('dt (DateTimeFormat) Tests');
		await allure.tags(...sharedTags);

		await allure.step('Formatting date to 12-hour format', async (ctx) => {
			const testDate = new Date('2024-01-15T14:30:00');
			const formatted = dt.format(testDate);

			await ctx.parameter('Formatted Date', formatted);

			expect(formatted).toMatch(/\d{2}:\d{2}\s[AP]M/);
		});
	});

	test('date - should return a formatted date string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('date Tests');
		await allure.tags(...sharedTags);

		await allure.step('Retrieving formatted date string', async (ctx) => {
			const formattedDate = date;

			await ctx.parameter('Formatted Date', formattedDate);

			expect(typeof formattedDate).toBe('string');
			expect(formattedDate).toMatch(/\d{2}:\d{2}\s[AP]M/);
		});
	});

	test('cancelMessage - should contain cancellation text and support link', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('cancelMessage Tests');
		await allure.tags(...sharedTags);

		await allure.step('Checking cancelMessage content', async (ctx) => {
			await ctx.parameter('cancelMessage', cancelMessage);

			expect(cancelMessage).toContain('Operation cancelled');
			expect(cancelMessage).toContain('https://chat.studiocms.dev');
		});
	});

	[
		{
			name: 'cancelled - should format cancellation message correctly',
			message: 'Test cancellation',
			toContain: ['cancelled', 'Test cancellation'],
		},
		{
			name: 'cancelled - should format cancellation message with tip',
			message: 'Test cancellation',
			tip: 'Try again later',
			toContain: ['cancelled', 'Test cancellation', '▶ Try again later'],
		},
	].forEach(({ name, message, tip, toContain }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('cancelled Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Generating cancelled message', async (ctx) => {
				const result = cancelled(message, tip);
				const stripped = stripAnsi(result);

				toContain.forEach((text, index) => {
					ctx.parameter(`Contains [${index}]`, text);
					expect(stripped).toContain(text);
				});
			});
		});
	});

	[
		{
			name: 'success - should format success message without tip',
			message: 'Build completed',
			toContain: ['success', 'Build completed'],
		},
		{
			name: 'success - should format success message with tip',
			message: 'Build completed',
			tip: 'Run npm start',
			toContain: ['success', 'Build completed', '▶ Run npm start'],
		},
	].forEach(({ name, message, tip, toContain }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('success Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Generating success message', async (ctx) => {
				const result = success(message, tip);
				const stripped = stripAnsi(result);

				toContain.forEach((text, index) => {
					ctx.parameter(`Contains [${index}]`, text);
					expect(stripped).toContain(text);
				});
			});
		});
	});

	[
		{
			name: 'getName - should return a non-empty string',
			validate: (name: string) => {
				expect(typeof name).toBe('string');
				expect(name.length).toBeGreaterThan(0);
			},
		},
		{
			name: 'getName - should return first word of name',
			validate: (name: string) => {
				expect(name).not.toContain(' ');
			},
		},
	].forEach(({ name, validate }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getName Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Retrieving name', async (ctx) => {
				const result = await getName();
				ctx.parameter('Name', result);
				validate(result);
			});
		});
	});

	test('label - should create a labeled string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('label Function Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating label', async (ctx) => {
			const result = label('Test Label');
			const stripped = stripAnsi(result);
			ctx.parameter('Label', stripped);
			expect(stripped).toContain('Test Label');
			expect(stripped.trim()).toMatch(/Test Label/);
		});
	});

	[
		{
			actionOpts: { name: 'c', ctrl: true } as any,
			actionSelectMode: false,
			expected: 'abort',
			name: 'action - should return "abort" for Ctrl+C',
		},
		{
			actionOpts: { name: 'd', ctrl: true } as any,
			actionSelectMode: false,
			expected: 'abort',
			name: 'action - should return "abort" for Ctrl+D',
		},
		{
			actionOpts: { name: 'return' } as any,
			actionSelectMode: false,
			expected: 'submit',
			name: 'action - should return "submit" for return key',
		},
		{
			actionOpts: { name: 'up' } as any,
			actionSelectMode: false,
			expected: 'up',
			name: 'action - should return "up" for up arrow',
		},
		{
			actionOpts: { name: 'down' } as any,
			actionSelectMode: false,
			expected: 'down',
			name: 'action - should return "down" for down arrow',
		},
		{
			actionOpts: { name: 'j' } as any,
			actionSelectMode: true,
			expected: 'down',
			name: 'action - should return "down" for j in select mode',
		},
		{
			actionOpts: { name: 'j' } as any,
			actionSelectMode: false,
			expected: false,
			name: 'action - should return false for j when not in select mode',
		},
		{
			actionOpts: { name: 'a', meta: true } as any,
			actionSelectMode: false,
			expected: undefined,
			name: 'action - should return undefined for meta keys (except escape)',
		},
		{
			actionOpts: { name: 'e', ctrl: true, meta: true } as any,
			actionSelectMode: false,
			expected: undefined,
			name: 'action - should return undefined for meta control keys',
		},
		{
			actionOpts: { name: 'g', ctrl: true, meta: true } as any,
			actionSelectMode: false,
			expected: undefined,
			name: 'action - should return undefined for meta control keys (ctrl + meta)',
		},
		{
			actionOpts: { name: 'k', meta: true } as any,
			actionSelectMode: true,
			expected: undefined,
			name: 'action - should return undefined for meta keys in select mode',
		},
	].forEach(({ name, actionOpts, actionSelectMode, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('action Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Determining action', async (ctx) => {
				const result = action(actionOpts, actionSelectMode);
				ctx.parameter('Action Result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	test('setStdout - should set custom stdout without throwing', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('setStdout Function Tests');
		await allure.tags(...sharedTags);

		await allure.step('Setting custom stdout', async (ctx) => {
			const mockStdout = { columns: 100 } as typeof process.stdout;
			expect(() => setStdout(mockStdout)).not.toThrow();
			ctx.parameter('Custom Stdout Columns', String(mockStdout.columns));
		});
	});

	[
		{
			name: 'boxen - should create a boxed output with header',
			header: 'Header',
			body: undefined,
			footer: undefined,
			expectedContents: ['Header'],
		},
		{
			name: 'boxen - should create a boxed output with body',
			header: undefined,
			body: { ln3: 'Body text' },
			footer: undefined,
			expectedContents: ['Body text'],
		},
		{
			name: 'boxen - should create a boxed output with footer',
			header: undefined,
			body: undefined,
			footer: 'Footer',
			expectedContents: ['Footer'],
		},
		{
			name: 'boxen - should create a boxed output with all parts',
			header: 'Header',
			body: { ln0: 'Line 0', ln3: 'Line 3' },
			footer: 'Footer',
			expectedContents: ['Header', 'Line 0', 'Line 3', 'Footer'],
		},
	].forEach(({ name, header, body, footer, expectedContents }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('boxen Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Creating boxed output', async (ctx) => {
				const result = boxen(header, body, footer);
				const stripped = stripAnsi(result);

				expectedContents.forEach((text, index) => {
					ctx.parameter(`Contains [${index}]`, text);
					expect(stripped).toContain(text);
				});
			});
		});
	});

	[
		{
			name: 'randomBetween - should return a number within range',
			min: 1,
			max: 10,
			validate: (result: number) => {
				expect(result).toBeGreaterThanOrEqual(1);
				expect(result).toBeLessThanOrEqual(10);
			},
		},
		{
			name: 'randomBetween - should return min when min equals max',
			min: 5,
			max: 5,
			validate: (result: number) => {
				expect(result).toBe(5);
			},
		},
		{
			name: 'randomBetween - should handle large ranges',
			min: 0,
			max: 1000,
			validate: (result: number) => {
				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThanOrEqual(1000);
			},
		},
	].forEach(({ name, min, max, validate }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('randomBetween Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Generating random number', async (ctx) => {
				const result = randomBetween(min, max);
				ctx.parameter('Random Number', String(result));
				validate(result);
			});
		});
	});

	test('sleep - should delay execution for specified time', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('sleep Function Tests');
		await allure.tags(...sharedTags);

		await allure.step('Delaying execution', async (ctx) => {
			const delay = 200; // milliseconds
			const start = Date.now();
			await sleep(delay);
			const duration = Date.now() - start;

			ctx.parameter('Requested Delay (ms)', String(delay));
			ctx.parameter('Actual Delay (ms)', String(duration));

			expect(duration).toBeGreaterThanOrEqual(delay - 10); // Allow slight variance
		});
	});

	test('createClackMessageUpdate - should create a render function', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createClackMessageUpdate Function Tests');
		await allure.tags(...sharedTags);

		await allure.step('Creating Clack message update', async (ctx) => {
			const render = createClackMessageUpdate(mockStream);
			ctx.parameter('Render Type', typeof render);
			expect(typeof render).toBe('function');
			expect(typeof render.clear).toBe('function');
			expect(typeof render.done).toBe('function');
		});
	});

	[
		{
			name: 'createClackMessageUpdate - should write to stream when rendering',
			arguments: 'Test message',
			validate: () => {
				expect(mockStream.write).toHaveBeenCalled();
			},
		},
		{
			name: 'createClackMessageUpdate - should clear previous output',
			arguments: 'Test message',
			method: 'clear',
			validate: () => {
				expect(mockStream.write).toHaveBeenCalled();
			},
		},
		{
			name: 'createClackMessageUpdate - should handle multiline messages',
			arguments: 'Line 1\nLine 2\nLine 3',
			validate: () => {
				expect(mockStream.write).toHaveBeenCalled();
			},
		},
	].forEach(({ name, arguments: args, method, validate }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('createClackMessageUpdate Method Tests');
			await allure.tags(...sharedTags);

			await allure.step('Using Clack message update', async (ctx) => {
				const render = createClackMessageUpdate(mockStream);
				if (method && typeof (render as any)[method] === 'function') {
					(render as any)[method]();
				} else {
					render(args);
				}
				ctx.parameter('Arguments', String(args));
				validate();
			});
		});
	});
});
