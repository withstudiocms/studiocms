import * as allure from 'allure-js-commons';
import { beforeAll, describe, expect, test } from 'vitest';
import { createMarkdownProcessor, markdownConfigDefaults } from '../../../src/core/index.js';
import type { MarkdownProcessor } from '../../../src/types.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'remark Discord Subtext Plugin Tests';

describe(parentSuiteName, () => {
	let processor: MarkdownProcessor;

	beforeAll(async () => {
		processor = await createMarkdownProcessor(markdownConfigDefaults);
	});

	test('-# should be converted to small text like discord', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Subtext Tests');
		await allure.tags(...sharedTags);

		const markdown = '-# This should be small text';
		const { code } = await processor.render(markdown);

		expect(code).toBe('<p><small>This should be small text</small></p>');
	});
});
