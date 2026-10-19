import * as allure from 'allure-js-commons';
import { beforeAll, describe, expect, test } from 'vitest';
import { createMarkdownProcessor, markdownConfigDefaults } from '../../../src/core/index.js';
import type { MarkdownProcessor } from '../../../src/types.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'rehypeAutolinkHeadings Plugin Tests';

describe(parentSuiteName, () => {
	let processor: MarkdownProcessor;

	beforeAll(async () => {
		processor = await createMarkdownProcessor(markdownConfigDefaults);
	});

	[
		{
			name: 'URLs starting with a protocol in plain text should be autolinked',
			markdown: 'See https://example.com for more.',
			validate: (code: string) => {
				expect(code.replace(/\n/g, '')).toBe(
					`<p>See <a href="https://example.com">https://example.com</a> for more.</p>`
				);
			},
		},
		{
			name: 'URLs starting with "www." in plain text should be autolinked',
			markdown: 'See www.example.com for more.',
			validate: (code: string) => {
				expect(code.trim()).toBe(
					`<p>See <a href="http://www.example.com">www.example.com</a> for more.</p>`
				);
			},
		},
		{
			name: 'URLs in code blocks should not be autolinked',
			markdown: 'See `https://example.com` or `www.example.com` for more.',
			validate: (code: string) => {
				expect(code.trim()).toBe(
					'<p>See <code>https://example.com</code> or <code>www.example.com</code> for more.</p>'
				);
			},
		},
	].forEach(({ name, markdown, validate }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Autolinking Tests');
			await allure.tags(...sharedTags);

			const { code } = await processor.render(markdown);
			validate(code);
		});
	});
});
