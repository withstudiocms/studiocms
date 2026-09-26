import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { FALLBACK_OG_IMAGE } from '../../src/components/consts.js';
import { getHeroImage, trimInput } from '../../src/components/heroHelper.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Component Helper Tests';

describe(parentSuiteName, () => {
	test('FALLBACK_OG_IMAGE should be defined and a valid URL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('FALLBACK_OG_IMAGE Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating FALLBACK_OG_IMAGE constant', async (ctx) => {
			await ctx.parameter('FALLBACK_OG_IMAGE', FALLBACK_OG_IMAGE);

			expect(FALLBACK_OG_IMAGE).toBeDefined();
			expect(typeof FALLBACK_OG_IMAGE).toBe('string');
			expect(FALLBACK_OG_IMAGE).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
			expect(FALLBACK_OG_IMAGE).toContain('auto=format');
			expect(FALLBACK_OG_IMAGE).toContain('fit=crop');
		});
	});

	[
		{
			input: null,
			expected: undefined,
		},
		{
			input: undefined,
			expected: undefined,
		},
		{
			input: '',
			expected: undefined,
		},
		{
			input: '   ',
			expected: undefined,
		},
		{
			input: '  hello world  ',
			expected: 'hello world',
		},
		{
			input: '\n\tfoo bar\t\n',
			expected: 'foo bar',
		},
		{
			input: 'baz',
			expected: 'baz',
		},
	].forEach(({ input, expected }) => {
		test(`trimInput('${input}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('trimInput Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Input', JSON.stringify(input));

			await allure.step(`Trimming input: ${JSON.stringify(input)}`, async (ctx) => {
				const result = trimInput(input);
				await ctx.parameter('Result', JSON.stringify(result));
				expect(result).toBe(expected);
			});
		});
	});

	const mockAstro = (defaultOgImage?: string | null | undefined) => ({
		locals: {
			StudioCMS: {
				siteConfig: {
					data: {
						defaultOgImage,
					},
				},
			},
		},
	});

	[
		{
			Astro: mockAstro('site-og.png'),
			heroInput: '  hero.png  ',
			expected: 'hero.png',
		},
		{
			Astro: mockAstro('site-og.png'),
			heroInput: 'hero.png',
			expected: 'hero.png',
		},
		{
			Astro: mockAstro('site-og.png'),
			heroInput: undefined,
			expected: 'site-og.png',
		},
		{
			Astro: mockAstro('site-og.png'),
			heroInput: '',
			expected: 'site-og.png',
		},
		{
			Astro: mockAstro('site-og.png'),
			heroInput: '   ',
			expected: 'site-og.png',
		},
		{
			Astro: mockAstro(undefined),
			heroInput: '',
			expected: FALLBACK_OG_IMAGE,
		},
		{
			Astro: mockAstro(''),
			heroInput: '',
			expected: FALLBACK_OG_IMAGE,
		},
		{
			Astro: mockAstro('   '),
			heroInput: '   ',
			expected: FALLBACK_OG_IMAGE,
		},
		{
			Astro: {},
			heroInput: undefined,
			expected: FALLBACK_OG_IMAGE,
		},
		{
			Astro: { locals: {} },
			heroInput: undefined,
			expected: FALLBACK_OG_IMAGE,
		},
		{
			Astro: mockAstro('   site-og.png   '),
			heroInput: '   ',
			expected: 'site-og.png',
		},
	].forEach(({ Astro, heroInput, expected }) => {
		test(`getHeroImage('${heroInput}', Astro) should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getHeroImage Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Hero Input', JSON.stringify(heroInput));

			await allure.step(
				`Getting hero image for input: ${JSON.stringify(heroInput)}`,
				async (ctx) => {
					const result = getHeroImage(heroInput as string | undefined, Astro as any);
					await ctx.parameter('Result', JSON.stringify(result));
					expect(result).toBe(expected);
				}
			);
		});
	});
});
