import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { renderMDX } from '../../src/lib/render.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'renderMDX Function Tests';

describe(parentSuiteName, () => {
	[
		{
			name: 'keeps safe static HTML elements in the rendered output',
			content: '<div title="safe">allowed <strong>HTML</strong></div>',
			expected: '<div title="safe">allowed <strong>HTML</strong></div>',
		},
		{
			name: 'keeps safe inline HTML elements inside Markdown',
			content: 'Hello <em>world</em>',
			expected: '<p>Hello <em>world</em></p>',
		},
	].forEach(({ name, content, expected }) =>
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MDX Security Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Rendering MDX content: ${content}`, async (ctx) => {
				const html = await renderMDX(content);
				await ctx.parameter('renderedHTML', html);
				expect(html).toBe(expected);
			});
		})
	);

	test('rejects custom components', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Security Tests');
		await allure.tags(...sharedTags);

		await allure.step('Rendering MDX content with a custom component', async (ctx) => {
			await ctx.parameter('mdxContent', '<Button>no</Button>');
			await expect(renderMDX('<Button>no</Button>')).rejects.toThrow(
				'Unsupported MDX element: Button'
			);
		});
	});
});
