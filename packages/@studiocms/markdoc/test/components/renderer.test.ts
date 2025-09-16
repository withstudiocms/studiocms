/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test, vi } from 'vitest';

import MarkDocRenderer from '../../src/components/MarkDocRenderer.astro';
import {
	complexMarkdocContent,
	createEmptyProps,
	createMockProps,
	createNullContentProps,
	createUndefinedContentProps,
	createWhitespaceProps,
	type MarkDocRendererProps,
	sampleMarkdocContent,
} from '../test-utils';

// Mock the Markdoc renderer
vi.mock('studiocms:markdoc/renderer', () => ({
	default: vi.fn((content: string) => {
		// Simple mock that converts markdoc content to HTML
		return Promise.resolve(
			content
				.replace(/^# (.*$)/gm, '<h1>$1</h1>')
				.replace(/^## (.*$)/gm, '<h2>$1</h2>')
				.replace(/^### (.*$)/gm, '<h3>$1</h3>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
				.replace(/{% callout type="([^"]+)" %}([\s\S]*?){% \/callout %}/g, '<div class="callout callout-$1">$2</div>')
				.replace(/{% if ([^%]+) %}([\s\S]*?){% \/if %}/g, '<div class="conditional">$2</div>')
				.replace(/{{ ([^}]+) }}/g, '<span class="variable">$1</span>')
				.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
				.replace(/\n/g, '<br>')
		);
	}),
}));

describe('MarkDoc Renderer component', () => {
	test('Renderer with valid Markdoc content', async () => {
		const container = await AstroContainer.create();
		const props = createMockProps(sampleMarkdocContent);
		const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

		expect(result).toContain('<h1>Hello World</h1>');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<a href="https://example.com">link</a>');
		expect(result).toContain('callout');
		expect(result).toContain('conditional');
	});

	test('Renderer with empty content', async () => {
		const container = await AstroContainer.create();
		const props = createMockProps('');
		const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('Renderer with undefined defaultContent', async () => {
		const container = await AstroContainer.create();
		const props: MarkDocRendererProps = createUndefinedContentProps();
		const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	test('Renderer with complex Markdoc content including tags and variables', async () => {
		const container = await AstroContainer.create();
		const props: MarkDocRendererProps = createMockProps(complexMarkdocContent);
		const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

		expect(result).toContain('<h1>Main Title</h1>');
		expect(result).toContain('<h2>Subtitle</h2>');
		expect(result).toContain('<h3>Features</h3>');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<em>italic</em>');
		expect(result).toContain('<a href="https://example.com">External link</a>');
		expect(result).toContain('callout');
		expect(result).toContain('conditional');
		expect(result).toContain('variable');
	});

	test('Renderer with Markdoc tags and syntax', async () => {
		const container = await AstroContainer.create();
		const markdocWithTags = `# Markdoc Tags

{% callout type="info" %}
This is an info callout.
{% /callout %}

{% if condition %}
This content is conditional.
{% /if %}

Variable: {{ user.name }}`;

		const props: MarkDocRendererProps = createMockProps(markdocWithTags);
		const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

		expect(result).toContain('<h1>Markdoc Tags</h1>');
		expect(result).toContain('callout-info');
		expect(result).toContain('conditional');
		expect(result).toContain('variable');
	});

	test('Renderer handles missing data prop gracefully', async () => {
		const container = await AstroContainer.create();
		const props: MarkDocRendererProps = createEmptyProps();
		const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

		expect(result).toContain('<h1>Error: No content found</h1>');
	});

	describe('Edge cases', () => {
		test('Renderer handles null content', async () => {
			const container = await AstroContainer.create();
			const props: MarkDocRendererProps = createNullContentProps();
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			expect(result).toContain('<h1>Error: No content found</h1>');
		});

		test('Renderer handles undefined content', async () => {
			const container = await AstroContainer.create();
			const props: MarkDocRendererProps = createUndefinedContentProps();
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			expect(result).toContain('<h1>Error: No content found</h1>');
		});

		test('Renderer handles whitespace-only content', async () => {
			const container = await AstroContainer.create();
			const props: MarkDocRendererProps = createWhitespaceProps();
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			expect(result).toContain('<br>');
		});

		test('Renderer handles very long content', async () => {
			const container = await AstroContainer.create();
			const longContent = `# Title\n\n${'A'.repeat(10000)}`;
			const props: MarkDocRendererProps = createMockProps(longContent);
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			expect(result).toContain('<h1>Title</h1>');
		});

		test('Renderer handles malformed Markdoc syntax', async () => {
			const container = await AstroContainer.create();
			const malformedContent = `# Title

{% callout type="info"
This is malformed callout syntax.

{% if condition
This is malformed if syntax.`;

			const props: MarkDocRendererProps = createMockProps(malformedContent);
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			// Should still render basic markdown even with malformed tags
			expect(result).toContain('<h1>Title</h1>');
		});

		test('Renderer handles nested Markdoc tags', async () => {
			const container = await AstroContainer.create();
			const nestedContent = `# Nested Tags

{% callout type="warning" %}
{% if true %}
This is nested content.
{% /if %}
{% /callout %}`;

			const props: MarkDocRendererProps = createMockProps(nestedContent);
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			expect(result).toContain('<h1>Nested Tags</h1>');
			expect(result).toContain('callout-warning');
			expect(result).toContain('conditional');
		});

		test('Renderer handles code blocks with syntax highlighting', async () => {
			const container = await AstroContainer.create();
			const codeContent = `# Code Examples

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

\`\`\`typescript
interface User {
  id: number;
  name: string;
}
\`\`\``;

			const props: MarkDocRendererProps = createMockProps(codeContent);
			const result = await container.renderToString(MarkDocRenderer, { props: props as unknown as Record<string, unknown> });

			expect(result).toContain('<h1>Code Examples</h1>');
			expect(result).toContain('<pre><code class="language-javascript">');
			expect(result).toContain('<pre><code class="language-typescript">');
		});
	});
});
