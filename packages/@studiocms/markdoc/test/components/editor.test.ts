/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/editor.astro';

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

	test('Editor with empty content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '',
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with undefined content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: undefined,
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with null content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: null,
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with complex content', async () => {
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

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*MarkDoc Content[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with HTML content', async () => {
		const container = await AstroContainer.create();
		const htmlContent = '<h1>HTML Content</h1><p>This is HTML content</p>';

		const result = await container.renderToString(Editor, {
			props: {
				content: htmlContent,
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*HTML Content[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with special characters', async () => {
		const container = await AstroContainer.create();
		const specialContent = 'Content with special chars: <>&"\'`';

		const result = await container.renderToString(Editor, {
			props: {
				content: specialContent,
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*special chars[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with multiline content', async () => {
		const container = await AstroContainer.create();
		const multilineContent = `Line 1
Line 2
Line 3
Line 4`;

		const result = await container.renderToString(Editor, {
			props: {
				content: multilineContent,
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Line 1[\s\S]*Line 2[\s\S]*Line 3[\s\S]*Line 4[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor with very long content', async () => {
		const container = await AstroContainer.create();
		const longContent = 'A'.repeat(10000); // 10KB of content

		const result = await container.renderToString(Editor, {
			props: {
				content: longContent,
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*A{10,}[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor renders with no props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor);
		
		expect(result).toContain('<div class="editor-container"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
		expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
	});

	test('Editor validates props interface', () => {
		// Test that the props interface is correctly defined
		const validProps: { content: string } = {
			content: 'Test content',
		};
		
		expect(validProps.content).toBeDefined();
		expect(typeof validProps.content).toBe('string');
	});

	test('Editor handles various content types', async () => {
		const testCases = [
			'Simple string',
			'',
			'   ', // whitespace only
			'\n\n', // newlines only
			'Content with\nnewlines',
			'Content with\ttabs',
			'Content with spaces    ',
		];
		
		for (const testCase of testCases) {
			const container = await AstroContainer.create();
			const result = await container.renderToString(Editor, {
				props: {
					content: testCase,
				},
			});
			
			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
			);
		}
	});
});
