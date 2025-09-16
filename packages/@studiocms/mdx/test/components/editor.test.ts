/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/editor.astro';

interface TestEditorProps {
	content?: string | null;
	[key: string]: unknown;
}

describe('MDX Editor component', () => {
	test('Editor with props', async () => {
		const container = await AstroContainer.create();
		const props: TestEditorProps = {
			content: '# Hello MDX\n\nThis is **bold** text with a [link](https://example.com).',
		};
		const result = await container.renderToString(Editor, { props });

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Hello MDX[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with empty content', async () => {
		const container = await AstroContainer.create();
		const props: TestEditorProps = {
			content: '',
		};
		const result = await container.renderToString(Editor, { props });

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
	});

	test('Editor with MDX content including JSX', async () => {
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

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*MDX Content[\s\S]*<\/textarea>/
		);
		expect(result).toContain('Button');
	});

	test('Editor with undefined content', async () => {
		const container = await AstroContainer.create();
		const props: TestEditorProps = {
			content: undefined,
		};
		const result = await container.renderToString(Editor, { props });

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
	});

	describe('Edge cases', () => {
		test('Editor with null content', async () => {
			const container = await AstroContainer.create();
			const props: TestEditorProps = {
				content: null,
			};
			const result = await container.renderToString(Editor, { props });

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
		});

		test('Editor with whitespace-only content', async () => {
			const container = await AstroContainer.create();
			const props: TestEditorProps = {
				content: '   \n\t   ',
			};
			const result = await container.renderToString(Editor, { props });

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
		});

		test('Editor with very long content', async () => {
			const container = await AstroContainer.create();
			const longContent = '# Title\n\n' + 'A'.repeat(10000);
			const props: TestEditorProps = {
				content: longContent,
			};
			const result = await container.renderToString(Editor, { props });

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Title[\s\S]*<\/textarea>/
			);
		});

		test('Editor with no props', async () => {
			const container = await AstroContainer.create();
			const props: TestEditorProps = {};
			const result = await container.renderToString(Editor, { props });

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
		});
	});
});
