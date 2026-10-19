/// <reference types="astro/client" />

import * as allure from 'allure-js-commons';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/editor.astro';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Editor Component Tests';

describe(parentSuiteName, () => {
	test('Editor with props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor Component Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with provided content', async (ctx) => {
			const container = await AstroContainer.create();
			const result = await container.renderToString(Editor, {
				props: {
					content: 'Editor content',
				},
			});

			await ctx.parameter('editorContent', 'Editor content');

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Editor content[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});

	test('Editor with empty content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor Component Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with empty content', async (ctx) => {
			const container = await AstroContainer.create();
			const result = await container.renderToString(Editor, {
				props: {
					content: '',
				},
			});

			await ctx.parameter('editorContent', '"" (empty string)');

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});

	test('Editor with undefined content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor Component Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with undefined content', async (ctx) => {
			const container = await AstroContainer.create();
			const result = await container.renderToString(Editor, {
				props: {
					content: undefined,
				},
			});

			await ctx.parameter('editorContent', 'undefined');

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});

	test('Editor with null content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor Component Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with null content', async (ctx) => {
			const container = await AstroContainer.create();
			const result = await container.renderToString(Editor, {
				props: {
					content: null,
				},
			});

			await ctx.parameter('editorContent', 'null');

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});

	test('Editor with complex content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor Component Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with complex content', async (ctx) => {
			const container = await AstroContainer.create();
			const complexContent = `# MarkDoc Content

This is a complex MarkDoc content with:

- List item 1
- List item 2

\`\`\`javascript
const code = "example";
\`\`\`

**Bold text** and *italic text*`;

			const result = await container.renderToString(Editor, {
				props: {
					content: complexContent,
				},
			});

			await ctx.parameter('editorContent', complexContent);

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*MarkDoc Content[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});
});
