/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test, vi } from 'vitest';
import MDXRenderer from '../../src/components/MDXRenderer.astro';

interface MDXRendererProps {
	data: {
		defaultContent?: {
			content?: string | null;
		};
	};
	[key: string]: unknown;
}

// Mock the MDX renderer
vi.mock('studiocms:mdx/renderer', () => ({
	default: vi.fn((content: string) => {
		// Simple mock that converts markdown-like content to HTML
		return Promise.resolve(
			content
				.replace(/^# (.*$)/gm, '<h1>$1</h1>')
				.replace(/^## (.*$)/gm, '<h2>$1</h2>')
				.replace(/^### (.*$)/gm, '<h3>$1</h3>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
				.replace(/\n/g, '<br>')
		);
	}),
}));

describe('MDX Renderer component', () => {
	test('Renderer with valid content', async () => {
		const container = await AstroContainer.create();
		const props: MDXRendererProps = {
			data: {
				defaultContent: {
					content: '# Hello World\n\nThis is **bold** text with a [link](https://example.com).',
				},
			},
		};
		const result = await container.renderToString(MDXRenderer, { props });

		expect(result).toContain('<h1>Hello World</h1>');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<a href="https://example.com">link</a>');
	});

	test('Renderer with empty content', async () => {
		const container = await AstroContainer.create();
		const props: MDXRendererProps = {
			data: {
				defaultContent: {
					content: '',
				},
			},
		};
		const result = await container.renderToString(MDXRenderer, { props });

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('Renderer with undefined defaultContent', async () => {
		const container = await AstroContainer.create();
		const props: MDXRendererProps = {
			data: {
				defaultContent: undefined,
			},
		};
		const result = await container.renderToString(MDXRenderer, { props });

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('Renderer with MDX content including JSX-like syntax', async () => {
		const container = await AstroContainer.create();
		const mdxContent = `# MDX Content

import { Button } from './components/Button';

This is MDX content with a component:

<Button>Click me!</Button>

And some **bold** text.`;

		const props: MDXRendererProps = {
			data: {
				defaultContent: {
					content: mdxContent,
				},
			},
		};
		const result = await container.renderToString(MDXRenderer, { props });

		expect(result).toContain('<h1>MDX Content</h1>');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('Button');
	});

	test('Renderer with complex markdown content', async () => {
		const container = await AstroContainer.create();
		const complexContent = `# Main Title

## Subtitle

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

[External link](https://example.com)

\`\`\`javascript
const code = 'example';
console.log(code);
\`\`\``;

		const props: MDXRendererProps = {
			data: {
				defaultContent: {
					content: complexContent,
				},
			},
		};
		const result = await container.renderToString(MDXRenderer, { props });

		expect(result).toContain('<h1>Main Title</h1>');
		expect(result).toContain('<h2>Subtitle</h2>');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<em>italic</em>');
		expect(result).toContain('<a href="https://example.com">External link</a>');
	});

	test('Renderer handles missing data prop gracefully', async () => {
		const container = await AstroContainer.create();
		const props: MDXRendererProps = {
			data: {},
		};
		const result = await container.renderToString(MDXRenderer, { props });

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	describe('Edge cases', () => {
		test('Renderer handles null content', async () => {
			const container = await AstroContainer.create();
			const props: MDXRendererProps = {
				data: {
					defaultContent: {
						content: null,
					},
				},
			};
			const result = await container.renderToString(MDXRenderer, { props });

			expect(result).toContain('<h1>Error: No content found</h1>');
		});

		test('Renderer handles undefined content', async () => {
			const container = await AstroContainer.create();
			const props: MDXRendererProps = {
				data: {
					defaultContent: {
						content: undefined,
					},
				},
			};
			const result = await container.renderToString(MDXRenderer, { props });

			expect(result).toContain('<h1>Error: No content found</h1>');
		});

		test('Renderer handles whitespace-only content', async () => {
			const container = await AstroContainer.create();
			const props: MDXRendererProps = {
				data: {
					defaultContent: {
						content: '   \n\t   ',
					},
				},
			};
			const result = await container.renderToString(MDXRenderer, { props });

			expect(result).toContain('<br>');
		});

		test('Renderer handles very long content', async () => {
			const container = await AstroContainer.create();
			const longContent = `# Title\n\n${'A'.repeat(10000)}`;
			const props: MDXRendererProps = {
				data: {
					defaultContent: {
						content: longContent,
					},
				},
			};
			const result = await container.renderToString(MDXRenderer, { props });

			expect(result).toContain('<h1>Title</h1>');
		});
	});
});
