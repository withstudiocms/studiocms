import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { parseMarkdown } from '../../src/utils/tinyMDParser';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'tinyMDParser Utility tests';

describe(parentSuiteName, () => {
	[
		{
			input: '# Hello World',
			toContain: ['<h1>Hello World</h1>'],
		},
		{
			input: `
| Foo | Bar |
| --- | --- |
| baz | qux |
`,
			toContain: ['<table>', '<td>baz</td>', '<td>qux</td>'],
		},
		{
			input: `
- [x] Done
- [ ] Not done
`,
			toContain: ['type="checkbox"', 'checked'],
		},
		{
			input: '[StudioCMS](https://studiocms.dev) is *awesome*!',
			toContain: ['<a href="https://studiocms.dev">StudioCMS</a>', '<em>awesome</em>'],
		},
	].forEach(({ input, toContain }) => {
		const testName = 'parses markdown input correctly';
		const tags = [...sharedTags, 'utility:tinyMDParser', 'function:parseMarkdown'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.parameter('input', input);

			await allure.step('Parsing markdown input', async () => {
				const html = parseMarkdown(input);
				for (const snippet of toContain) {
					expect(html).toContain(snippet);
				}
			});
		});
	});

	test('returns empty string for empty input', async () => {
		const testName = 'returns empty string for empty input';
		const tags = [...sharedTags, 'utility:tinyMDParser', 'function:parseMarkdown'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite(testName);
		await allure.tags(...tags);

		await allure.step('Parsing empty markdown input', async () => {
			const html = parseMarkdown('');
			expect(html).toBe('');
		});
	});
});
