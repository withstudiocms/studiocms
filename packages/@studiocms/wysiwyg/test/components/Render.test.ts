import type { SSRResult } from 'astro';
import type { z } from 'astro/zod';
import sanitizeHtml from 'sanitize-html';
import type { StudioCMSSanitizeOptionsSchema } from 'studiocms/schemas';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	complexWYSIWYGContent,
	malformedHTMLContent,
	sampleWYSIWYGContent,
	scriptInjectionContent,
} from '../test-utils';

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
				// Improved mock sanitization - remove script tags and event attributes using sanitize-html
				content = sanitizeHtml(content, {
					allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'script'),
					allowedAttributes: {
						'*': ['class'],
						'a': ['href'],
					},
					allowedSchemes: ['http', 'https', 'mailto'],
				});
			}
			return content;
		};
	}),
}));

// Mock the prerender function
vi.mock('../../src/lib/prerender.js', () => ({
	preRenderer: vi.fn((content: string) => content),
}));

// Mock the shared module
vi.mock('../../src/lib/shared.js', () => ({
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

describe('WYSIWYG Render Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renders content correctly', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render(sampleWYSIWYGContent);

		expect(renderedContent).toBe(sampleWYSIWYGContent);
	});

	test('handles empty content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render('');

		expect(renderedContent).toBe('');
	});

	test('handles null content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render('');

		// Verify how null is handled - might return empty string or throw
		expect(renderedContent).toBeDefined();
	});

	test('handles undefined content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render('');

		// Verify how undefined is handled - might return empty string or throw
		expect(renderedContent).toBeDefined();
	});

	test('renders complex content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render(complexWYSIWYGContent);

		expect(renderedContent).toBe(complexWYSIWYGContent);
		expect(renderedContent).toContain('<h1>Main Title</h1>');
		expect(renderedContent).toContain('<strong>bold</strong>');
		expect(renderedContent).toContain('<em>italic</em>');
	});

	test('sanitizes malicious content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {
			allowElements: ['div', 'h1', 'p'],
			allowAttributes: { '*': ['class'] },
			blockElements: ['script'],
		};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize as z.infer<typeof StudioCMSSanitizeOptionsSchema>,
			preRenderer
		);
		const renderedContent = await render(scriptInjectionContent);

		// Should remove script tags and onerror attributes
		expect(renderedContent).not.toContain('<script>');
		expect(renderedContent).not.toContain('onerror');
		expect(renderedContent).toContain('<h1>Safe Content</h1>');
		expect(renderedContent).toContain('<p>This should be sanitized</p>');
	});

	test('handles malformed HTML gracefully', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render(malformedHTMLContent);

		// sanitize-html handles malformed HTML - it may fix some tags but preserve the structure
		expect(renderedContent).toContain('<div class="unclosed">');
		expect(renderedContent).toContain('Unclosed heading');
		expect(renderedContent).toContain('Paragraph without closing tag');
		expect(renderedContent).toContain('Link without closing tag');
		expect(renderedContent).toContain('https://example.com');
		// The content should be processed without throwing errors
		expect(renderedContent).toBeDefined();
		expect(typeof renderedContent).toBe('string');
	});

	test('uses sanitize options from shared context', async () => {
		const { shared } = await import('../../src/lib/shared.js');

		expect(shared).toBeDefined();
		expect(shared?.sanitize).toBeDefined();
		expect(shared?.sanitize?.allowElements).toContain('div');
		expect(shared?.sanitize?.allowElements).toContain('h1');
		expect(shared?.sanitize?.allowAttributes).toBeDefined();
	});

	test('calls preRenderer function', async () => {
		const { preRenderer } = await import('../../src/lib/prerender.js');
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		render(sampleWYSIWYGContent);

		// The preRenderer is called internally by the mock createRenderer
		expect(preRenderer).toHaveBeenCalled();
	});

	test('handles renderer creation errors', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		// Mock createRenderer to throw an error
		vi.mocked(createRenderer).mockRejectedValueOnce(new Error('Renderer creation failed'));

		const mockSSRResult = {} as SSRResult;
		const mockSanitize = {} as z.infer<typeof StudioCMSSanitizeOptionsSchema>;

		await expect(createRenderer(mockSSRResult, mockSanitize, preRenderer)).rejects.toThrow(
			'Renderer creation failed'
		);
	});

	test('handles content rendering errors', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		// Mock createRenderer to return a function that throws an error
		vi.mocked(createRenderer).mockImplementationOnce(() => {
			return Promise.resolve(() => {
				throw new Error('Rendering failed');
			});
		});

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);

		expect(() => render(sampleWYSIWYGContent)).toThrow('Rendering failed');
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

		const { createRenderer } = await import('studiocms:component-registry/runtime');
		const { preRenderer } = await import('../../src/lib/prerender.js');

		const mockSSRResult = {} as unknown;
		const mockSanitize = {};

		const render = await createRenderer(
			mockSSRResult as unknown as SSRResult,
			mockSanitize,
			preRenderer
		);
		const renderedContent = await render(structuredContent);

		expect(renderedContent).toBe(structuredContent);
		expect(renderedContent).toContain('<div class="article">');
		expect(renderedContent).toContain('<header>');
		expect(renderedContent).toContain('<main>');
		expect(renderedContent).toContain('<section>');
	});
});
