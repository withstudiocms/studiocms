import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock @markdoc/markdoc
vi.mock('@markdoc/markdoc', () => ({
	default: {
		parse: vi.fn((_content: string) => ({
			type: 'document',
			children: [
				{
					type: 'heading',
					level: 1,
					children: [{ type: 'text', content: 'Test Title' }],
				},
			],
		})),
		transform: vi.fn((_ast: unknown) => ({
			type: 'document',
			children: [
				{
					type: 'heading',
					level: 1,
					children: [{ type: 'text', content: 'Test Title' }],
				},
			],
		})),
		renderers: {
			html: vi.fn((_content: unknown) => '<h1>Test Title</h1>'),
			reactStatic: vi.fn((_content: unknown) => '<h1>Test Title</h1>'),
		},
	},
}));

vi.mock('../../src/lib/shared.js', () => ({
	shared: {
		markDocConfig: {
			type: 'html',
			argParse: undefined,
			transformConfig: undefined,
		},
	},
}));

// Don't mock the render function - we want to test the actual implementation

describe('MarkDoc Render Library', () => {
	beforeEach(async () => {
		// Reset shared config before each test
		const { shared } = await import('../../src/lib/shared.js');
		shared.markDocConfig = {
			type: 'html',
			argParse: undefined,
			transformConfig: undefined,
		};
	});

	test('renderMarkDoc with HTML renderer', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		shared.markDocConfig.type = 'html';

		const content = '# Test Title';
		const result = await renderMarkDoc(content);

		expect(result).toBe('<h1>Test Title</h1>');
		// Verify that Markdoc.parse was called with the content
		const Markdoc = await import('@markdoc/markdoc');
		expect(Markdoc.default.parse).toHaveBeenCalledWith(content, undefined);
		// Verify that Markdoc.transform was called
		expect(Markdoc.default.transform).toHaveBeenCalled();
		// Verify that HTML renderer was called
		expect(Markdoc.default.renderers.html).toHaveBeenCalled();
	});

	test('renderMarkDoc with react-static renderer', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		shared.markDocConfig.type = 'react-static';

		const content = '# Test Title';
		const result = await renderMarkDoc(content);

		expect(result).toBe('<h1>Test Title</h1>');
		// Verify that Markdoc.parse was called with the content
		const Markdoc = await import('@markdoc/markdoc');
		expect(Markdoc.default.parse).toHaveBeenCalledWith(content, undefined);
		// Verify that Markdoc.transform was called
		expect(Markdoc.default.transform).toHaveBeenCalled();
		// Verify that react-static renderer was called
		expect(Markdoc.default.renderers.reactStatic).toHaveBeenCalled();
	});

	test('renderMarkDoc with argParse configuration', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		const argParse = {};
		shared.markDocConfig.argParse = argParse;

		const content = '# Test Title';
		const result = await renderMarkDoc(content);

		expect(result).toBe('<h1>Test Title</h1>');
		// Verify that Markdoc.parse was called with the argParse configuration
		const Markdoc = await import('@markdoc/markdoc');
		expect(Markdoc.default.parse).toHaveBeenCalledWith(content, argParse);
		// Verify that Markdoc.transform was called
		expect(Markdoc.default.transform).toHaveBeenCalled();
		// Verify that HTML renderer was called
		expect(Markdoc.default.renderers.html).toHaveBeenCalled();
	});

	test('renderMarkDoc with transformConfig configuration', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		const transformConfig = {
			nodes: {
				heading: {
					render: 'Heading',
					attributes: {
						level: { type: Number },
					},
				},
			},
		};
		shared.markDocConfig.transformConfig = transformConfig;

		const content = '# Test Title';
		const result = await renderMarkDoc(content);

		expect(result).toBe('<h1>Test Title</h1>');
		// Verify that Markdoc.parse was called
		const Markdoc = await import('@markdoc/markdoc');
		expect(Markdoc.default.parse).toHaveBeenCalledWith(content, undefined);
		// Verify that Markdoc.transform was called with the transformConfig
		expect(Markdoc.default.transform).toHaveBeenCalledWith(
			expect.any(Object), // AST from parse
			transformConfig
		);
		// Verify that HTML renderer was called
		expect(Markdoc.default.renderers.html).toHaveBeenCalled();
	});

	test('renderMarkDoc handles complex content', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		shared.markDocConfig.type = 'html';

		const complexContent = `# Main Title

## Subtitle

This is **bold** text.

{% callout type="info" %}
This is a callout.
{% /callout %}`;

		const result = await renderMarkDoc(complexContent);

		expect(result).toBe('<h1>Test Title</h1>');
	});

	test('renderMarkDoc handles empty content', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		shared.markDocConfig.type = 'html';

		const result = await renderMarkDoc('');

		expect(result).toBe('<h1>Test Title</h1>');
	});

	test('renderMarkDoc handles whitespace content', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		shared.markDocConfig.type = 'html';

		const result = await renderMarkDoc('   \n\t   ');

		expect(result).toBe('<h1>Test Title</h1>');
	});

	test('renderMarkDoc handles malformed content gracefully', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		shared.markDocConfig.type = 'html';

		const malformedContent = `# Title

{% callout type="info"
This is malformed.

{% if condition
This is also malformed.`;

		const result = await renderMarkDoc(malformedContent);

		expect(result).toBe('<h1>Test Title</h1>');
	});

	test('renderMarkDoc with all configuration options', async () => {
		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		const argParse = {};
		const transformConfig = {
			nodes: {
				heading: {
					render: 'Heading',
					attributes: {
						level: { type: Number },
					},
				},
			},
		};

		shared.markDocConfig = {
			type: 'html',
			argParse,
			transformConfig,
		};

		const content = '# Test Title';
		const result = await renderMarkDoc(content);

		expect(result).toBe('<h1>Test Title</h1>');
	});
});
