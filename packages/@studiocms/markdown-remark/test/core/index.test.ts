import * as allure from 'allure-js-commons';
import { beforeAll, describe, expect, test } from 'vitest';
import { createMarkdownProcessor, markdownConfigDefaults } from '../../src/core/index.js';
import type { MarkdownProcessor } from '../../src/types.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'createMarkdownProcessor Tests';

describe(parentSuiteName, () => {
	let processor: MarkdownProcessor;

	beforeAll(async () => {
		processor = await createMarkdownProcessor(markdownConfigDefaults);
	});

	test('should not unescape entities in regular Markdown', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Entities Tests');
		await allure.tags(...sharedTags);

		const markdown = '&lt;i&gt;This should NOT be italic&lt;/i&gt;';
		const { code } = await processor.render(markdown);

		expect(code).toBe('<p>&#x3C;i>This should NOT be italic&#x3C;/i></p>');
	});

	test('should be able to get the file path when passing fileURL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('File URL Tests');
		await allure.tags(...sharedTags);
		let context: { path: any } = { path: null };

		const processor = await createMarkdownProcessor({
			remarkPlugins: [
				() => {
					const transformer = (_tree: any, file: any) => {
						context = file;
					};
					return transformer;
				},
			],
		});

		await processor.render('test', {
			fileURL: new URL('virtual.md', import.meta.url),
		});

		expect(typeof context).toBe('object');
		expect(context.path).toBe(new URL('virtual.md', import.meta.url).pathname);
	});
});
