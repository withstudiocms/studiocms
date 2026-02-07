import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	createHead,
	type HeadConfig,
	HeadConfigSchema,
	type HeadUserConfig,
	hasTag,
	mergeHead,
	sortHead,
} from '../src/headConfigSchema.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'HeadConfigSchema Tests';

describe(parentSuiteName, () => {
	// HeadConfigSchema tests
	[
		{
			name: 'HeadConfigSchema - Validates correct config',
			tests: [
				{
					input: [
						{ tag: 'title', attrs: {}, content: 'My Title' },
						{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
					],
					expect: {
						length: 2,
						firstTag: 'title',
						firstContent: 'My Title',
						secondTag: 'meta',
					},
				},
			],
		},
		{
			name: 'HeadConfigSchema - Applies defaults',
			tests: [
				{
					input: undefined,
					expect: {
						length: 0,
						firstTag: undefined,
						firstContent: undefined,
						secondTag: undefined,
					},
				},
				{
					input: [{ tag: 'title', attrs: {} }],
					expect: {
						length: 1,
						firstTag: 'title',
						firstContent: '',
						secondTag: undefined,
					},
				},
			],
		},
	].forEach(({ name, tests }) => {
		tests.forEach(({ input, expect: exp }) => {
			test(name, async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite(localSuiteName);
				await allure.subSuite(name);
				await allure.tags(...sharedTags);

				await allure.parameter('input', JSON.stringify(input));
				await allure.parameter('expected', JSON.stringify(exp));

				const schema = HeadConfigSchema();

				await allure.step('Parsing input with HeadConfigSchema', async (ctx) => {
					const parsed = schema.parse(input);
					await ctx.parameter('parsed', JSON.stringify(parsed));

					await ctx.parameter('parsed length', String(parsed.length));
					expect(parsed.length).toBe(exp.length);
					if (exp.firstTag) {
						await ctx.parameter('first tag', exp.firstTag);
						expect(parsed[0].tag).toBe(exp.firstTag);
					}
					if (exp.secondTag) {
						await ctx.parameter('second tag', exp.secondTag);
						expect(parsed[1].tag).toBe(exp.secondTag);
					}
					if (exp.firstContent !== undefined) {
						await ctx.parameter('first content', exp.firstContent);
						expect(parsed[0].content).toBe(exp.firstContent);
					}
				});
			});
		});
	});

	// createHead tests
	test('HeadConfigSchema - createHead merges and sorts head configs', async () => {
		const defaults: HeadUserConfig = [
			{ tag: 'meta', attrs: { charset: true }, content: '' },
			{ tag: 'title', attrs: {}, content: 'Default Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc1' }, content: '' },
		];
		const override: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'Override Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc2' }, content: '' },
			{ tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width' }, content: '' },
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HeadConfigSchema - createHead merges and sorts head configs');
		await allure.tags(...sharedTags);

		await allure.parameter('defaults', JSON.stringify(defaults));
		await allure.parameter('override', JSON.stringify(override));

		const result = createHead(defaults, override);

		await allure.step('Resulting head config', async (ctx) => {
			await ctx.parameter('result', JSON.stringify(result));
		});

		await allure.step(
			'Should have only one title and one description meta (from override)',
			async (ctx) => {
				const actualTitles = result.some(
					(t) => t.tag === 'title' && t.content === 'Override Title'
				);
				await ctx.parameter('has override title', String(actualTitles));
				expect(actualTitles).toBe(true);

				const actualDescriptions = result.some(
					(t) => t.tag === 'meta' && t.attrs.name === 'description' && t.attrs.content === 'desc2'
				);
				await ctx.parameter('has override description', String(actualDescriptions));
				expect(actualDescriptions).toBe(true);
			}
		);

		await allure.step('Should retain charset meta from defaults', async (ctx) => {
			const idxViewport = result.findIndex((t) => t.attrs.name === 'viewport');
			const idxCharset = result.findIndex((t) => t.attrs.charset === true);
			const idxTitle = result.findIndex((t) => t.tag === 'title');

			await ctx.parameter('idxCharset', String(idxCharset));
			await ctx.parameter('idxViewport', String(idxViewport));
			await ctx.parameter('idxTitle', String(idxTitle));

			await ctx.parameter('charset before title', String(idxCharset < idxTitle));
			await ctx.parameter('viewport before title', String(idxViewport < idxTitle));

			expect(idxViewport).toBeLessThan(idxTitle);
			expect(idxCharset).toBeLessThan(idxTitle);
		});
	});

	// hasTag tests
	test('HeadConfigSchema - hasTag detects existing title and meta', async () => {
		const head: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'A' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HeadConfigSchema - hasTag detects existing title and meta');
		await allure.tags(...sharedTags);

		await allure.parameter('head', JSON.stringify(head));

		await allure.step('Checking for existing tags', async (ctx) => {
			const hasTitle = hasTag(head, { tag: 'title', attrs: {}, content: 'A' });
			await ctx.parameter('has title', String(hasTitle));
			expect(hasTitle).toBe(true);

			const hasDescription = hasTag(head, {
				tag: 'meta',
				attrs: { name: 'description', content: 'desc' },
				content: '',
			});
			await ctx.parameter('has description meta', String(hasDescription));
			expect(hasDescription).toBe(true);

			const hasKeywords = hasTag(head, {
				tag: 'meta',
				attrs: { name: 'keywords', content: 'k' },
				content: '',
			});
			await ctx.parameter('has keywords meta', String(hasKeywords));
			expect(hasKeywords).toBe(false);
		});
	});

	// mergeHead tests
	test('HeadConfigSchema - mergeHead overwrites by new head', async () => {
		const oldHead: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'Old' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc1' }, content: '' },
		];
		const newHead: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'New' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc2' }, content: '' },
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HeadConfigSchema - mergeHead overwrites by new head');
		await allure.tags(...sharedTags);

		await allure.parameter('oldHead', JSON.stringify(oldHead));
		await allure.parameter('newHead', JSON.stringify(newHead));

		const merged = mergeHead(oldHead, newHead);

		await allure.step('Merged head config', async (ctx) => {
			await ctx.parameter('merged', JSON.stringify(merged));
		});

		await allure.step('Should have new title and description, old removed', async (ctx) => {
			const hasNewTitle = merged.some((t) => t.tag === 'title' && t.content === 'New');
			await ctx.parameter('has new title', String(hasNewTitle));
			expect(hasNewTitle).toBe(true);

			const hasNewDesc = merged.some(
				(t) => t.tag === 'meta' && t.attrs.name === 'description' && t.attrs.content === 'desc2'
			);
			await ctx.parameter('has new description', String(hasNewDesc));
			expect(hasNewDesc).toBe(true);

			const hasOldTitle = merged.some((t) => t.tag === 'title' && t.content === 'Old');
			await ctx.parameter('has old title', String(hasOldTitle));
			expect(hasOldTitle).toBe(false);

			const hasOldDesc = merged.some(
				(t) => t.tag === 'meta' && t.attrs.name === 'description' && t.attrs.content === 'desc1'
			);
			await ctx.parameter('has old description', String(hasOldDesc));
			expect(hasOldDesc).toBe(false);
		});
	});

	// sortHead tests
	test('HeadConfigSchema - sortHead puts important tags first', async () => {
		const head: HeadConfig = [
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
			{ tag: 'title', attrs: {}, content: 'Title' },
			{ tag: 'meta', attrs: { charset: true }, content: '' },
			{ tag: 'link', attrs: { rel: 'shortcut icon', href: '/favicon.ico' }, content: '' },
			{ tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width' }, content: '' },
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('HeadConfigSchema - sortHead puts important tags first');
		await allure.tags(...sharedTags);

		await allure.parameter('head', JSON.stringify(head));

		const sorted = sortHead([...head] as HeadConfig);

		await allure.step('Sorted head config', async (ctx) => {
			await ctx.parameter('sorted', JSON.stringify(sorted));
		});

		await allure.step('Should have important tags in correct order', async (ctx) => {
			const idxCharset = sorted.findIndex((t) => t.attrs.charset === true);
			const idxViewport = sorted.findIndex((t) => t.attrs.name === 'viewport');
			const idxTitle = sorted.findIndex((t) => t.tag === 'title');
			const idxFavicon = sorted.findIndex((t) => t.tag === 'link');
			const idxDesc = sorted.findIndex((t) => t.attrs.name === 'description');

			await ctx.parameter('idxCharset', String(idxCharset));
			await ctx.parameter('idxViewport', String(idxViewport));
			await ctx.parameter('idxTitle', String(idxTitle));
			await ctx.parameter('idxFavicon', String(idxFavicon));
			await ctx.parameter('idxDesc', String(idxDesc));

			await ctx.parameter('charset before title', String(idxCharset < idxTitle));
			await ctx.parameter('viewport before title', String(idxViewport < idxTitle));
			await ctx.parameter('title before favicon', String(idxTitle < idxFavicon));
			await ctx.parameter('favicon before description', String(idxFavicon < idxDesc));

			expect(idxCharset).toBeLessThan(idxTitle);
			expect(idxViewport).toBeLessThan(idxTitle);
			expect(idxTitle).toBeLessThan(idxFavicon);
			expect(idxFavicon).toBeLessThan(idxDesc);
		});
	});
});
