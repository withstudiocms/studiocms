/// <reference types="astro/client" />
import * as allure from 'allure-js-commons';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/editor.astro';
import { parentSuiteName, sharedTags } from '../test-utils.js';

interface TestEditorProps {
	content?: string | null;
	[key: string]: unknown;
}

const localSuiteName = 'MDX Editor Component Tests';

describe(parentSuiteName, () => {
	test('Render with basic props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Render Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with basic props', async (ctx) => {
			const container = await AstroContainer.create();
			const props: TestEditorProps = {
				content: '# Hello MDX\n\nThis is **bold** text with a [link](https://example.com).',
			};
			const result = await container.renderToString(Editor, { props });
			await ctx.parameter('Rendered Output Length', String(result.length));

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Hello MDX[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});

	test('Render with empty content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Render Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should render Editor component with empty content', async (ctx) => {
			const container = await AstroContainer.create();
			const props: TestEditorProps = {
				content: '',
			};
			const result = await container.renderToString(Editor, { props });
			await ctx.parameter('Rendered Output Length', String(result.length));

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
		});
	});

	test('Render with MDX content including JSX', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Render Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Should render Editor component with MDX content including JSX',
			async (ctx) => {
				const container = await AstroContainer.create();
				const mdxContent = `# MDX Content

import { Button } from './components/Button';

This is MDX content with a component:

<Button>Click me!</Button>

And some **bold** text.`;

				const props: TestEditorProps = {
					content: mdxContent,
				};
				const result = await container.renderToString(Editor, { props });
				await ctx.parameter('Rendered Output Length', String(result.length));

				expect(result).toContain('<div class="editor-container"');
				expect(result).toMatch(
					/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*MDX Content[\s\S]*<\/textarea>/
				);
				expect(result).toContain('Button');
			}
		);
	});
});
