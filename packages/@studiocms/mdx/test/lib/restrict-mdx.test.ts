import { compile } from '@mdx-js/mdx';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { restrictMdx } from '../../src/lib/restrict-mdx.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'restrictMdx Plugin Tests';

describe(parentSuiteName, () => {
	test.each([
		['ESM imports', "import Component from './component.js'", 'Unsupported MDX syntax: mdxjsEsm'],
		['text expressions', 'Hello {globalThis.process}', 'Unsupported MDX syntax: mdxTextExpression'],
		['flow expressions', '{globalThis.process}', 'Unsupported MDX syntax: mdxFlowExpression'],
		['custom components', '<Button>not allowed</Button>', 'Unsupported MDX element: Button'],
		['dangerous HTML elements', '<script>alert(1)</script>', 'Unsupported MDX element: script'],
		[
			'dynamic HTML attributes',
			'<div data-value={globalThis.process} />',
			'only static HTML attributes are allowed',
		],
		[
			'event handler attributes',
			'<div onClick="alert(1)" />',
			'Unsupported MDX HTML attribute: onClick',
		],
		[
			'scriptable URLs',
			'<a href="javascript:alert(1)">click</a>',
			'Unsafe URL in MDX HTML attribute: href',
		],
	])('rejects %s', async (_label, content, expectedError) => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Security Tests');
		await allure.tags(...sharedTags);

		await allure.step(`Compiling MDX content: ${content}`, async (ctx) => {
			await ctx.parameter('mdxContent', content);
			await ctx.parameter('expectedError', expectedError);
			await expect(
				compile(content, {
					outputFormat: 'function-body',
					remarkPlugins: [restrictMdx],
				})
			).rejects.toThrow(expectedError);
		});
	});

	[
		{
			name: 'allows safe static HTML elements',
			content: '<div className="box" title="safe">allowed HTML</div>',
		},
		{
			name: 'continues to compile regular Markdown and GFM',
			content: '# Heading\n\n- [x] safe Markdown',
		},
	].forEach(({ name, content }) =>
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MDX Security Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Compiling MDX content: ${content}`, async (ctx) => {
				await ctx.parameter('mdxContent', content);
				await expect(
					compile(content, {
						outputFormat: 'function-body',
						remarkPlugins: [restrictMdx],
					})
				).resolves.toBeDefined();
			});
		})
	);
});
