import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'MarkDoc Render Library Tests';

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

describe(parentSuiteName, () => {
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
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('renderMarkDoc Function Tests');
		await allure.tags(...sharedTags);

		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		await allure.step('Should render MarkDoc content using HTML renderer', async (ctx) => {
			shared.markDocConfig.type = 'html';

			await ctx.parameter('rendererType', 'html');

			const content = '# Test Title';
			const result = await renderMarkDoc(content);

			await ctx.parameter('inputContent', content);
			await ctx.parameter('renderedOutput', result);

			expect(result).toBe('<h1>Test Title</h1>');
			// Verify that Markdoc.parse was called with the content
			const Markdoc = await import('@markdoc/markdoc');
			expect(Markdoc.default.parse).toHaveBeenCalledWith(content, undefined);
			// Verify that Markdoc.transform was called
			expect(Markdoc.default.transform).toHaveBeenCalled();
			// Verify that HTML renderer was called
			expect(Markdoc.default.renderers.html).toHaveBeenCalled();
		});
	});

	test('renderMarkDoc with react-static renderer', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('renderMarkDoc Function Tests');
		await allure.tags(...sharedTags);

		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		await allure.step('Should render MarkDoc content using react-static renderer', async (ctx) => {
			shared.markDocConfig.type = 'react-static';

			await ctx.parameter('rendererType', 'react-static');

			const content = '# Test Title';
			const result = await renderMarkDoc(content);

			await ctx.parameter('inputContent', content);
			await ctx.parameter('renderedOutput', result);

			expect(result).toBe('<h1>Test Title</h1>');
			// Verify that Markdoc.parse was called with the content
			const Markdoc = await import('@markdoc/markdoc');
			expect(Markdoc.default.parse).toHaveBeenCalledWith(content, undefined);
			// Verify that Markdoc.transform was called
			expect(Markdoc.default.transform).toHaveBeenCalled();
			// Verify that react-static renderer was called
			expect(Markdoc.default.renderers.reactStatic).toHaveBeenCalled();
		});
	});

	test('renderMarkDoc with transformConfig configuration', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('renderMarkDoc Function Tests');
		await allure.tags(...sharedTags);

		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		await allure.step('Should apply transformConfig during rendering', async (ctx) => {
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

			await ctx.parameter('transformConfig', JSON.stringify(transformConfig, null, 2));

			const content = '# Test Title';
			const result = await renderMarkDoc(content);

			await ctx.parameter('inputContent', content);
			await ctx.parameter('renderedOutput', result);

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
	});

	test('renderMarkDoc handles complex content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('renderMarkDoc Function Tests');
		await allure.tags(...sharedTags);

		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		await allure.step('Should render complex MarkDoc content correctly', async (ctx) => {
			shared.markDocConfig.type = 'html';

			const complexContent = `# Main Title

## Subtitle

This is **bold** text.

{% callout type="info" %}
This is a callout.
{% /callout %}`;

			await ctx.parameter('rendererType', 'html');
			await ctx.parameter('complexContent', complexContent);

			const result = await renderMarkDoc(complexContent);

			await ctx.parameter('renderedOutput', result);

			expect(result).toBe('<h1>Test Title</h1>');
		});
	});

	test('renderMarkDoc handles empty content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('renderMarkDoc Function Tests');
		await allure.tags(...sharedTags);

		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		await allure.step('Should handle empty MarkDoc content gracefully', async (ctx) => {
			shared.markDocConfig.type = 'html';

			await ctx.parameter('rendererType', 'html');

			const result = await renderMarkDoc('');

			await ctx.parameter('inputContent', '"" (empty string)');
			await ctx.parameter('renderedOutput', result);

			expect(result).toBe('<h1>Test Title</h1>');
		});
	});

	test('renderMarkDoc with all configuration options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('renderMarkDoc Function Tests');
		await allure.tags(...sharedTags);

		const { shared } = await import('../../src/lib/shared.js');
		const { renderMarkDoc } = await import('../../src/lib/render.js');

		await allure.step('Should render with all config options set', async (ctx) => {
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

			await ctx.parameter('argParse', JSON.stringify(argParse, null, 2));
			await ctx.parameter('transformConfig', JSON.stringify(transformConfig, null, 2));

			shared.markDocConfig = {
				type: 'html',
				argParse,
				transformConfig,
			};

			const content = '# Test Title';
			const result = await renderMarkDoc(content);

			await ctx.parameter('inputContent', content);
			await ctx.parameter('renderedOutput', result);

			expect(result).toBe('<h1>Test Title</h1>');
		});
	});
});
