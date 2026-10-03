import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { transformHTML } from '../src/transform-html.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'TransformHTML Tests';

describe(parentSuiteName, () => {
	[
		{
			html: '<div><mycomponent></mycomponent></div>',
			components: {
				mycomponent: () => '<span>Hello World</span>',
			},
			expectedContains: ['Hello World', 'span'],
		},
		{
			html: '<div><script>alert("xss")</script><p>Safe content</p></div>',
			components: {},
			expectedNotContains: ['<script>', 'alert'],
			expectedContains: ['Safe content'],
		},
		{
			html: '<div><em>emphasized</em><strong>bold</strong></div>',
			components: {},
			sanitizeOpts: {
				allowedElements: ['div', 'strong'],
				blockElements: ['em'],
			},
			expectedNotContains: ['<em>'],
			expectedContains: ['<strong>', 'bold', 'emphasized'],
		},
		{
			html: `
			<div>
				<p>Indented content</p>
			</div>
		`,
			components: {},
			expectedContains: ['Indented content', '<div>', '<p>'],
		},
		{
			html: '<div><button></button><icon></icon></div>',
			components: {
				button: () => '<button>Click me</button>',
				icon: () => '<i class="icon">★</i>',
			},
			expectedContains: ['Click me', '★', '&lt;button&gt;', '&lt;i'],
		},
		{
			html: '',
			components: {},
			expected: '',
		},
	].forEach(
		({ html, components, sanitizeOpts, expected, expectedContains, expectedNotContains }) => {
			test('TransformHTML Test Case', async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite(localSuiteName);
				await allure.subSuite('transformHTML Tests');
				await allure.tags(...sharedTags);

				await allure.parameter('html', html);
				await allure.parameter('components', JSON.stringify(Object.keys(components)));
				if (sanitizeOpts) {
					await allure.parameter('sanitizeOpts', JSON.stringify(sanitizeOpts));
				}

				const result = await transformHTML(html, components, sanitizeOpts);

				if (expected !== undefined) {
					await allure.step('Should match expected output', async (ctx) => {
						await ctx.parameter('expected', expected);
						expect(result).toBe(expected);
					});
				}

				if (expectedContains) {
					for (const str of expectedContains) {
						await allure.step(`Should contain "${str}"`, async () => {
							expect(result).toContain(str);
						});
					}
				}

				if (expectedNotContains) {
					for (const str of expectedNotContains) {
						await allure.step(`Should not contain "${str}"`, async () => {
							expect(result).not.toContain(str);
						});
					}
				}
			});
		}
	);

	[
		{
			html: '<div data-test="value" onclick="alert()">Content</div>',
			components: {},
			sanitizeOpts: {
				dropAttributes: {
					onclick: ['div'],
				},
				allowAttributes: {
					'data-test': ['div'],
				},
			},
			expectedContains: ['data-test="value"'],
			expectedNotContains: ['onclick'],
			expectedToMatch: /data-test=["']value["']/,
		},
		{
			html: '<div><iframe src="evil.com"></iframe><p>Safe</p></div>',
			components: {},
			sanitizeOpts: {
				allowElements: ['div', 'p'],
			},
			expectedNotContains: ['<iframe>', 'evil.com'],
			expectedContains: ['Safe'],
		},
	].forEach(
		({
			html,
			components,
			sanitizeOpts,
			expectedContains,
			expectedNotContains,
			expectedToMatch,
		}) => {
			test('TransformHTML Sanitization Test Case', async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite(localSuiteName);
				await allure.subSuite('transformHTML Sanitization Tests');
				await allure.tags(...sharedTags);
				await allure.parameter('html', html);
				await allure.parameter('components', JSON.stringify(Object.keys(components)));
				if (sanitizeOpts) {
					await allure.parameter('sanitizeOpts', JSON.stringify(sanitizeOpts));
				}

				const result = await transformHTML(html, components, sanitizeOpts);

				if (expectedToMatch) {
					await allure.step(`Should match regex ${expectedToMatch}`, async (ctx) => {
						await ctx.parameter('expectedToMatch', expectedToMatch.toString());
						expect(result).toMatch(expectedToMatch);
					});
				}

				if (expectedContains) {
					for (const str of expectedContains) {
						await allure.step(`Should contain "${str}"`, async () => {
							expect(result).toContain(str);
						});
					}
				}

				if (expectedNotContains) {
					for (const str of expectedNotContains) {
						await allure.step(`Should not contain "${str}"`, async () => {
							expect(result).not.toContain(str);
						});
					}
				}
			});
		}
	);

	test('TransformHTML - Integration Test', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Test');
		await allure.tags(...sharedTags);

		const html = `
                <article class="post">
                    <postheader title="My Blog Post" author="John Doe"></postheader>
                    <section class="content">
                        <p>This is the introduction.</p>
                        <codesnippet language="javascript" code="console.log('Hello, world!');">
                        </codesnippet>
                        <p>This is the conclusion.</p>
                    </section>
                </article>
            `;
		const components = {
			postheader: ({ title, author }: { title: string; author: string }) =>
				`<header><h1>${title}</h1><p class="author">By ${author}</p></header>`,
			codesnippet: ({ language, code }: { language: string; code: string }) =>
				`<pre><code class="lang-${language}">${code.trim()}</code></pre>`,
		};

		await allure.parameter('html', html);
		await allure.parameter('components', JSON.stringify(Object.keys(components)));

		await allure.step('Should transform HTML with components correctly', async (ctx) => {
			const result = await transformHTML(html, components);

			await ctx.parameter('result', result);

			expect(result).toContain('My Blog Post');
			expect(result).toContain('John Doe');
			expect(result).toContain('introduction');
			expect(result).toContain('conclusion');
			expect(result).toContain('console.log');
			expect(result).toContain('lang-javascript');
		});
	});
});
