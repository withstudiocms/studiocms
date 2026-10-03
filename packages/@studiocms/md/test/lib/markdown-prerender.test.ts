import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as markdownPrerender from '../../src/lib/markdown-prerender.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'markdown-prerender Module Tests';

// Mock dependencies
vi.mock('@studiocms/markdown-remark/core', () => ({
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
			input: 'Hello **world**',
			expect: '<studiocms>Hello **world**</studiocms>',
		},
	].forEach(({ input, expect: expected }) => {
		test('renders markdown correctly', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Markdown Rendering Tests');
			await allure.tags(...sharedTags);
			// Re-import to apply new mock
			const { preRender } = await import('../../src/lib/markdown-prerender.js');
			const render = preRender();
			const result = await render(input);

			await allure.step('Should render markdown correctly', async (ctx) => {
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
