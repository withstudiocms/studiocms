/// <reference types="astro/client" />

import * as allure from 'allure-js-commons';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/markdown-editor.astro';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Editor component Tests';

describe(parentSuiteName, () => {
	test('Render Editor component', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor component Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component without props', async (ctx) => {
			const container = await AstroContainer.create();
			const result = await container.renderToString(Editor, {
				props: {
					content: 'Editor content',
				},
			});

			await ctx.parameter('Rendered Output', result);

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Editor content[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});
});
