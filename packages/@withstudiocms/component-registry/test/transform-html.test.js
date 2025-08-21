import assert from 'node:assert';
import { describe, it } from 'node:test';
import { transformHTML } from '../dist/transform-html.js'; // Adjust path as needed

describe('transformHTML', () => {
	it('should transform HTML with basic component swapping', async () => {
		const html = '<div><mycomponent></mycomponent></div>';
		const components = {
			mycomponent: () => '<span>Hello World</span>',
		};

		const result = await transformHTML(html, components);

		// The exact output depends on ultrahtml's behavior, but it should contain the swapped component
		assert.ok(result.includes('Hello World'));
		assert.ok(result.includes('span'));
	});

	it('should sanitize and transform HTML with dangerous content', async () => {
		const html = '<div><script>alert("xss")</script><p>Safe content</p></div>';
		const components = {};

		const result = await transformHTML(html, components);

		// Script tags should be removed by sanitization
		assert.ok(!result.includes('<script>'));
		assert.ok(!result.includes('alert'));
		assert.ok(result.includes('Safe content'));
	});

	it('should handle custom sanitization options', async () => {
		const html = '<div><em>emphasized</em><strong>bold</strong></div>';
		const components = {};
		const sanitizeOpts = {
			allowedElements: ['div', 'strong'], // Only allow div and strong tags
			blockElements: ['em'],
		};

		const result = await transformHTML(html, components, sanitizeOpts);

		// em tag should be removed, strong should remain
		assert.ok(!result.includes('<em>'));
		assert.ok(result.includes('<strong>'));
		assert.ok(result.includes('bold'));
		assert.ok(result.includes('emphasized')); // Content should remain
	});

	it('should dedent indented HTML before processing', async () => {
		const html = `
			<div>
				<p>Indented content</p>
			</div>
		`;
		const components = {};

		const result = await transformHTML(html, components);

		// Should contain the content regardless of original indentation
		assert.ok(result.includes('Indented content'));
		assert.ok(result.includes('<div>'));
		assert.ok(result.includes('<p>'));
	});

	it('should handle multiple component swaps', async () => {
		const html = '<div><button></button><icon></icon></div>';
		const components = {
			button: () => '<button>Click me</button>',
			icon: () => '<i class="icon">★</i>',
		};

		const result = await transformHTML(html, components);

		assert.ok(result.includes('Click me'));
		assert.ok(result.includes('★'));
		assert.ok(result.includes('&lt;button&gt;'));
		assert.ok(result.includes('&lt;i'));
	});

	it('should handle empty HTML', async () => {
		const html = '';
		const components = {};

		const result = await transformHTML(html, components);

		assert.strictEqual(result, '');
	});

	it('should handle HTML with no components to swap', async () => {
		const html = '<div><p>Regular HTML</p></div>';
		const components = {};

		const result = await transformHTML(html, components);

		assert.ok(result.includes('Regular HTML'));
		assert.ok(result.includes('<div>'));
		assert.ok(result.includes('<p>'));
	});

	it('should handle components with props', async () => {
		const html = '<div><greeting name="World"></greeting></div>';
		const components = {
			greeting: ({ name }) => `<span>Hello ${name}!</span>`,
		};

		const result = await transformHTML(html, components);

		assert.ok(result.includes('Hello World!'));
	});

	it('should preserve safe HTML attributes', async () => {
		const html = '<div class="container" id="main"><p class="text">Content</p></div>';
		const components = {};

		const result = await transformHTML(html, components);

		assert.ok(result.includes('class="container"') || result.includes("class='container'"));
		assert.ok(result.includes('Content'));
	});

	it('should handle malformed HTML gracefully', async () => {
		const html = '<div><p>Unclosed paragraph<span>Nested</span></div>';
		const components = {};

		const result = await transformHTML(html, components);

		// Should still contain the content, ultrahtml should handle malformed HTML
		assert.ok(result.includes('Unclosed paragraph'));
		assert.ok(result.includes('Nested'));
	});

	describe('sanitization with custom options', () => {
		it('should allow specific attributes when configured', async () => {
			const html = '<div data-test="value" onclick="alert()">Content</div>';
			const components = {};
			const sanitizeOpts = {
				dropAttributes: {
					onclick: ['div'], // Remove onclick from divs
				},
				allowAttributes: {
					'data-test': ['div'],
				},
			};

			const result = await transformHTML(html, components, sanitizeOpts);

			// data-test should be allowed, onclick should be removed
			assert.ok(result.includes('data-test="value"') || result.includes("data-test='value'"));
			assert.ok(!result.includes('onclick'));
			assert.ok(result.includes('Content'));
		});

		it('should handle strict sanitization', async () => {
			const html = '<div><iframe src="evil.com"></iframe><p>Safe</p></div>';
			const components = {};
			const sanitizeOpts = {
				allowElements: ['div', 'p'],
			};

			const result = await transformHTML(html, components, sanitizeOpts);

			assert.ok(!result.includes('<iframe>'));
			assert.ok(!result.includes('evil.com'));
			assert.ok(result.includes('Safe'));
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
				postheader: ({ title, author }) =>
					`<header><h1>${title}</h1><p class="author">By ${author}</p></header>`,
				codesnippet: ({ language, code }) =>
					`<pre><code class="lang-${language}">${code.trim()}</code></pre>`,
			};

			const result = await transformHTML(html, components);

			assert.ok(result.includes('My Blog Post'));
			assert.ok(result.includes('John Doe'));
			assert.ok(result.includes('introduction'));
			assert.ok(result.includes('conclusion'));
			assert.ok(result.includes('console.log'));
			assert.ok(result.includes('lang-javascript'));
		});
	});
});
