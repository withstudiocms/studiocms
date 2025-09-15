/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/markdown-editor.astro';

describe('Editor component', () => {
	test('Editor with props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: 'Editor content',
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Editor content[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});
});
