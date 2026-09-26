import { describe, expect } from 'vitest';
import { parseMarkdown } from '../../src/utils/tinyMDParser';
import { allureTester } from '../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'tinyMDParser Utility tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

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

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: testName,
				tags: [...tags],
				parameters: { input },
			});

			await step('Parsing markdown input', async () => {
				const html = parseMarkdown(input);
				for (const snippet of toContain) {
					expect(html).toContain(snippet);
				}
			});
		});
	});

	test('returns empty string for empty input', async ({ setupAllure, step }) => {
		const testName = 'returns empty string for empty input';
		const tags = [...sharedTags, 'utility:tinyMDParser', 'function:parseMarkdown'];

		await setupAllure({
			subSuiteName: testName,
			tags: [...tags],
		});

		await step('Parsing empty markdown input', async () => {
			const html = parseMarkdown('');
			expect(html).toBe('');
		});
	});
});
