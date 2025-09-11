import { describe, expect, it } from 'vitest';
import { transformHTML } from '../src/transform-html.js';

describe('transformHTML', () => {
	it('should transform HTML with basic component swapping', async () => {
		const html = '<div><mycomponent></mycomponent></div>';
		const components = {
			mycomponent: () => '<span>Hello World</span>',
		};

		const result = await transformHTML(html, components);

		expect(result).toContain('Hello World');
		expect(result).toContain('span');
	});

	it('should sanitize and transform HTML with dangerous content', async () => {
		const html = '<div><script>alert("xss")</script><p>Safe content</p></div>';
		const components = {};

		const result = await transformHTML(html, components);

		expect(result).not.toContain('<script>');
		expect(result).not.toContain('alert');
		expect(result).toContain('Safe content');
	});

	it('should handle custom sanitization options', async () => {
		const html = '<div><em>emphasized</em><strong>bold</strong></div>';
		const components = {};
		const sanitizeOpts = {
			allowedElements: ['div', 'strong'],
			blockElements: ['em'],
		};

		const result = await transformHTML(html, components, sanitizeOpts);

		expect(result).not.toContain('<em>');
		expect(result).toContain('<strong>');
		expect(result).toContain('bold');
		expect(result).toContain('emphasized');
	});

	it('should dedent indented HTML before processing', async () => {
		const html = `
            <div>
                <p>Indented content</p>
            </div>
        `;
		const components = {};

		const result = await transformHTML(html, components);

		expect(result).toContain('Indented content');
		expect(result).toContain('<div>');
		expect(result).toContain('<p>');
	});

	it('should handle multiple component swaps', async () => {
		const html = '<div><button></button><icon></icon></div>';
		const components = {
			button: () => '<button>Click me</button>',
			icon: () => '<i class="icon">★</i>',
		};

		const result = await transformHTML(html, components);

		expect(result).toContain('Click me');
		expect(result).toContain('★');
		expect(result).toContain('&lt;button&gt;');
		expect(result).toContain('&lt;i');
	});

	it('should handle empty HTML', async () => {
		const html = '';
		const components = {};

		const result = await transformHTML(html, components);

		expect(result).toBe('');
	});

	it('should handle HTML with no components to swap', async () => {
		const html = '<div><p>Regular HTML</p></div>';
		const components = {};

		const result = await transformHTML(html, components);

		expect(result).toContain('Regular HTML');
		expect(result).toContain('<div>');
		expect(result).toContain('<p>');
	});

	it('should handle components with props', async () => {
		const html = '<div><greeting name="World"></greeting></div>';
		const components = {
			greeting: ({ name }: { name: string }) => `<span>Hello ${name}!</span>`,
		};

		const result = await transformHTML(html, components);

		expect(result).toContain('Hello World!');
	});

	it('should preserve safe HTML attributes', async () => {
		const html = '<div class="container" id="main"><p class="text">Content</p></div>';
		const components = {};

		const result = await transformHTML(html, components);

		expect(result).toMatch(/class=["']container["']/);
		expect(result).toContain('Content');
	});

	it('should handle malformed HTML gracefully', async () => {
		const html = '<div><p>Unclosed paragraph<span>Nested</span></div>';
		const components = {};

		const result = await transformHTML(html, components);

		expect(result).toContain('Unclosed paragraph');
		expect(result).toContain('Nested');
	});

	describe('sanitization with custom options', () => {
		it('should allow specific attributes when configured', async () => {
			const html = '<div data-test="value" onclick="alert()">Content</div>';
			const components = {};
			const sanitizeOpts = {
				dropAttributes: {
					onclick: ['div'],
				},
				allowAttributes: {
					'data-test': ['div'],
				},
			};

			const result = await transformHTML(html, components, sanitizeOpts);

			expect(result).toMatch(/data-test=["']value["']/);
			expect(result).not.toContain('onclick');
			expect(result).toContain('Content');
		});

		it('should handle strict sanitization', async () => {
			const html = '<div><iframe src="evil.com"></iframe><p>Safe</p></div>';
			const components = {};
			const sanitizeOpts = {
				allowElements: ['div', 'p'],
			};

			const result = await transformHTML(html, components, sanitizeOpts);

			expect(result).not.toContain('<iframe>');
			expect(result).not.toContain('evil.com');
			expect(result).toContain('Safe');
		});
	});

	describe('integration tests', () => {
		it('should work with complex real-world HTML', async () => {
			const html = `
                <article class="post">
                    <postheader title="My Blog Post" author="John Doe"></postheader>
                    <section class="content">
                        <p>This is the introduction.</p>
                        <codesnippet language="javascript" code="console.log('Hello, world!');">
                        </codesnippet>
                        <p>This is the conclusion.</p>
                    </section>
                </article>
            `;
			const components = {
				postheader: ({ title, author }: { title: string; author: string }) =>
					`<header><h1>${title}</h1><p class="author">By ${author}</p></header>`,
				codesnippet: ({ language, code }: { language: string; code: string }) =>
					`<pre><code class="lang-${language}">${code.trim()}</code></pre>`,
			};

			const result = await transformHTML(html, components);

			expect(result).toContain('My Blog Post');
			expect(result).toContain('John Doe');
			expect(result).toContain('introduction');
			expect(result).toContain('conclusion');
			expect(result).toContain('console.log');
			expect(result).toContain('lang-javascript');
		});
	});
});
