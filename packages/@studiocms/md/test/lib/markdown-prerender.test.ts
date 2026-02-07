import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as markdownPrerender from '../../src/lib/markdown-prerender.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'markdown-prerender Module Tests';

// Mock dependencies
vi.mock('studiocms:md/config', () => ({
	default: { flavor: 'studiocms' },
}));
vi.mock('@astrojs/markdown-remark', () => ({
	createMarkdownProcessor: vi.fn(() =>
		Promise.resolve({
			render: vi.fn(async (content: string) => ({ code: `<astro>${content}</astro>` })),
		})
	),
}));
vi.mock('@studiocms/markdown-remark-processor', () => ({
	createMarkdownProcessor: vi.fn(() =>
		Promise.resolve({
			render: vi.fn(async (content: string) => ({ code: `<studiocms>${content}</studiocms>` })),
		})
	),
}));
vi.mock('./shared.js', () => ({
	shared: {
		astroMDRemark: {},
		mdConfig: {
			flavor: 'studiocms',
			autoLinkHeadings: false,
			discordSubtext: false,
			callouts: undefined,
		},
	},
}));

// Import after mocks

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.resetModules();
	});

	[
		{
			flavor: 'studiocms',
			input: 'Hello **world**',
			expect: '<studiocms>Hello **world**</studiocms>',
		},
		{
			flavor: 'astro',
			input: 'Hello **astro**',
			expect: '<astro>Hello **astro**</astro>',
		},
		{
			flavor: 'unknown',
			input: 'Hello **unknown**',
			expect: '<studiocms>Hello **unknown**</studiocms>',
		},
	].forEach(({ flavor, input, expect: expected }) => {
		test(`renders markdown correctly for flavor: ${flavor}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Markdown Rendering Tests');
			await allure.tags(...sharedTags);

			// Mock the config flavor
			vi.doMock('studiocms:md/config', () => ({
				default: { flavor },
			}));
			// Re-import to apply new mock
			const { preRender } = await import('../../src/lib/markdown-prerender.js');
			const render = preRender();
			const result = await render(input);

			await allure.step(`Should render markdown for flavor: ${flavor}`, async (ctx) => {
				await ctx.parameter('flavor', flavor);
				await ctx.parameter('input', input);
				await ctx.parameter('expectedOutput', expected);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{ opt: false as false, expect: false },
		{ opt: undefined, expect: undefined },
		{ opt: 'obsidian' as const, expect: { theme: 'obsidian' } },
		{ opt: 'github' as const, expect: { theme: 'github' } },
		{ opt: 'vitepress' as const, expect: { theme: 'vitepress' } },
	].forEach(({ opt, expect: expected }) => {
		test(`parseCallouts returns correct value for opt: ${String(opt)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parseCallouts Tests');
			await allure.tags(...sharedTags);

			const result = markdownPrerender.parseCallouts(opt);

			await allure.step(`Should parse callouts option: ${String(opt)}`, async (ctx) => {
				await ctx.parameter('inputOption', String(opt));
				await ctx.parameter('expectedOutput', JSON.stringify(expected));
				expect(result).toEqual(expected);
			});
		});
	});
});
