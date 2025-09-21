/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test, vi } from 'vitest';
import Editor from '../../src/components/Editor.astro';

// Mock the component registry
vi.mock('studiocms:component-registry/runtime', () => ({
	getRegistryComponents: vi.fn(() => [
		{
			name: 'Text',
			component: 'div',
			attributes: { class: 'text-component' },
		},
		{
			name: 'Heading',
			component: 'h1',
			attributes: { class: 'heading-component' },
		},
	]),
}));

// Mock the Astro global before importing the component
vi.mock('astro', () => ({
	locals: {
		StudioCMS: {
			plugins: {
				editorCSRFToken: 'mock-csrf-token',
			},
		},
	},
}));

describe('WYSIWYG Editor Component', () => {
	test('renders editor with basic content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '<p>Hello World</p>',
				id: 'test-page-id',
			},
		});

		expect(result).toContain('<div class="scms-grapesjs-container"');
		expect(result).toContain('data-page-id="test-page-id"');
		expect(result).toContain('data-component-registry=');
		expect(result).toContain('class="editor"');
		expect(result).toContain('<div id="gjs"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*style="display: none;"[^>]*>[\s\S]*&lt;p&gt;Hello World&lt;\/p&gt;[\s\S]*<\/textarea>/
		);
	});

	test('renders editor without page id', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '<h1>Title</h1>',
			},
		});

		expect(result).toContain('<div class="scms-grapesjs-container"');
		expect(result).toContain('data-page-id');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*&lt;h1&gt;Title&lt;\/h1&gt;[\s\S]*<\/textarea>/
		);
	});

	test('renders editor with empty content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '',
				id: 'empty-page',
			},
		});

		expect(result).toContain('<div class="scms-grapesjs-container"');
		expect(result).toContain('data-page-id="empty-page"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*<\/textarea>/
		);
	});

	test('renders editor with complex HTML content', async () => {
		const complexContent = `
			<div class="container">
				<h1>Title</h1>
				<p>Content with <strong>bold</strong> text</p>
				<ul>
					<li>Item 1</li>
					<li>Item 2</li>
				</ul>
			</div>
		`;

		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: complexContent,
				id: 'complex-page',
			},
		});

		expect(result).toContain('<div class="scms-grapesjs-container"');
		expect(result).toContain('data-page-id="complex-page"');
		expect(result).toMatch(
			/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*&lt;div class=&quot;container&quot;&gt;[\s\S]*&lt;h1&gt;Title&lt;\/h1&gt;[\s\S]*&lt;strong&gt;bold&lt;\/strong&gt;[\s\S]*<\/textarea>/
		);
	});

	test('includes component registry data', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '<p>Test</p>',
				id: 'registry-test',
			},
		});

		// Check that component registry data is included
		expect(result).toContain('data-component-registry=');

		// Extract and verify the registry data (HTML-encoded)
		const registryMatch = result.match(/data-component-registry="([^"]*)"/);
		expect(registryMatch).toBeTruthy();

		if (registryMatch) {
			// Decode HTML entities before parsing JSON
			const decodedRegistry = registryMatch[1]
				.replace(/&quot;/g, '"')
				.replace(/&#34;/g, '"')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>');
			const registryData = JSON.parse(decodedRegistry);
			expect(Array.isArray(registryData)).toBe(true);
			expect(registryData).toHaveLength(2);
			expect(registryData[0]).toHaveProperty('name', 'Text');
			expect(registryData[0]).toHaveProperty('component', 'div');
			expect(registryData[1]).toHaveProperty('name', 'Heading');
			expect(registryData[1]).toHaveProperty('component', 'h1');
		}
	});

	test('includes CSRF token when available', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '<p>Test</p>',
				id: 'csrf-test',
			},
		});

		// In test environment, Astro.locals is undefined, so no CSRF token should be present
		expect(result).not.toContain('data-editor-csrf-token=');
	});

	test('includes script module for GrapesJS initialization', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: '<p>Test</p>',
				id: 'script-test',
			},
		});

		expect(result).toContain('<script type="module"');
		expect(result).toContain('src=');
	});
});
