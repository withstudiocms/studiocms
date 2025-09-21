/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import sanitizeHtml from 'sanitize-html';
import { describe, expect, test, vi } from 'vitest';
import Render from '../../src/components/Render.astro';

// Mock the component registry renderer
vi.mock('studiocms:component-registry/runtime', () => ({
	createRenderer: vi.fn((_ssrResult, sanitize, preRenderer) => {
		return (content: string) => {
			// Handle null/undefined content
			if (content === null || content === undefined) {
				return '';
			}

			// Call preRenderer if provided
			if (preRenderer && typeof preRenderer === 'function') {
				content = preRenderer(content);
			}

			// Mock sanitization logic - only if sanitize is truthy
			if (sanitize && typeof content === 'string') {
				// Use proper HTML sanitization library for comprehensive security
				content = sanitizeHtml(content, {
					allowedTags: [
						'div',
						'h1',
						'h2',
						'h3',
						'p',
						'strong',
						'em',
						'a',
						'ul',
						'li',
						'pre',
						'code',
						'header',
						'main',
						'section',
						'article',
					],
					allowedAttributes: {
						'*': ['class'],
						a: ['href'],
					},
					disallowedTagsMode: 'discard',
				});
			}
			return content;
		};
	}),
}));

// Mock the prerender function
vi.mock('../../src/lib/prerender', () => ({
	preRenderer: vi.fn((content: string) => content),
}));

// Mock the shared module
vi.mock('../../src/lib/shared', () => ({
	shared: {
		sanitize: {
			allowElements: ['div', 'h1', 'h2', 'h3', 'p', 'strong', 'em', 'a', 'ul', 'li', 'pre', 'code'],
			allowAttributes: {
				'*': ['class'],
				a: ['href'],
			},
		},
	},
}));

// Mock the global $$result variable
(globalThis as unknown as { $$result: Record<string, unknown> }).$$result = {};

describe('WYSIWYG Render Component', () => {
	test('renders basic content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: '<p>Hello World</p>',
					},
				},
			},
		});

		expect(result).toContain('<p>Hello World</p>');
	});

	test('renders complex HTML content', async () => {
		const complexContent = `
			<div class="article">
				<h1>Main Title</h1>
				<p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
				<ul>
					<li>Item 1</li>
					<li>Item 2</li>
				</ul>
			</div>
		`;

		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: complexContent,
					},
				},
			},
		});

		expect(result).toContain('<h1>Main Title</h1>');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<em>italic</em>');
		expect(result).toContain('<div class="article">');
	});

	test('handles empty content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: '',
					},
				},
			},
		});

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('handles null content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: null,
					},
				},
			},
		});

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('handles undefined content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: undefined,
				},
			},
		});

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('sanitizes malicious content', async () => {
		const maliciousContent = `
			<h1>Safe Content</h1>
			<script>alert('XSS')</script>
			<p onclick="alert('XSS')">This should be sanitized</p>
		`;

		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: maliciousContent,
					},
				},
			},
		});

		expect(result).toContain('<h1>Safe Content</h1>');
		expect(result).toContain('This should be sanitized');
		expect(result).not.toContain('<script>');
		expect(result).not.toContain('onclick=');
	});

	test('handles malformed HTML gracefully', async () => {
		const malformedContent = `
			<div class="unclosed">
				<h1>Unclosed heading
				<p>Paragraph without closing tag
				<a href="https://example.com">Link without closing tag
		`;

		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: malformedContent,
					},
				},
			},
		});

		expect(result).toContain('<div class="unclosed">');
		expect(result).toContain('Unclosed heading');
		expect(result).toContain('Paragraph without closing tag');
		expect(result).toContain('https://example.com');
		expect(result).toBeDefined();
		expect(typeof result).toBe('string');
	});

	test('preserves content structure', async () => {
		const structuredContent = `
			<div class="article">
				<header>
					<h1>Article Title</h1>
					<p class="meta">Published on 2024-01-01</p>
				</header>
				<main>
					<section>
						<h2>Introduction</h2>
						<p>This is the introduction.</p>
					</section>
					<section>
						<h2>Conclusion</h2>
						<p>This is the conclusion.</p>
					</section>
				</main>
			</div>
		`;

		const container = await AstroContainer.create();
		const result = await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: structuredContent,
					},
				},
			},
		});

		expect(result).toContain('<div class="article">');
		expect(result).toContain('<header>');
		expect(result).toContain('<main>');
		expect(result).toContain('<section>');
		expect(result).toContain('<h1>Article Title</h1>');
		expect(result).toContain('<h2>Introduction</h2>');
		expect(result).toContain('<h2>Conclusion</h2>');
	});

	test('calls createRenderer with correct parameters', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender');
		const { shared } = await import('../../src/lib/shared');

		const container = await AstroContainer.create();
		await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: '<p>Test</p>',
					},
				},
			},
		});

		expect(createRenderer).toHaveBeenCalledWith(
			expect.any(Object), // $$result
			shared?.sanitize,
			preRenderer
		);
	});

	test('calls preRenderer function', async () => {
		const { preRenderer } = await import('../../src/lib/prerender');

		const container = await AstroContainer.create();
		await container.renderToString(Render, {
			props: {
				data: {
					defaultContent: {
						content: '<p>Test</p>',
					},
				},
			},
		});

		expect(preRenderer).toHaveBeenCalled();
	});
});
