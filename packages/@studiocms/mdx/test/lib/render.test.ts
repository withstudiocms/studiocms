import * as allure from 'allure-js-commons';
import type { JSXElementConstructor, ReactElement } from 'react';
import type { PluggableList } from 'unified';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { renderMDX } from '../../src/lib/render.js';
import { createMockMDXContent, parentSuiteName, sharedTags } from '../test-utils.js';

interface MockReactElement {
	type: unknown;
	props: Record<string, unknown>;
	key: string | null;
}

// Mock the dependencies
vi.mock('@mdx-js/mdx', () => ({
	evaluate: vi.fn(),
}));

vi.mock('react', () => ({
	createElement: vi.fn(
		(
			component: unknown,
			props: Record<string, unknown> = {},
			...children: unknown[]
		): MockReactElement => ({
			type: component,
			props: { ...props, children },
			key: null,
		})
	),
}));

vi.mock('react-dom/server', () => ({
	renderToString: vi.fn((element: MockReactElement | string): string => {
		// Simple mock renderer
		if (typeof element === 'string') return element;
		if (element?.type) {
			const props = element.props || {};
			const children = props.children || '';
			return `<${element.type}${Object.entries(props)
				.filter(([key]) => key !== 'children')
				.map(([key, value]) => ` ${key}="${value}"`)
				.join('')}>${children}</${element.type}>`;
		}
		return '';
	}),
}));

vi.mock('rehype-highlight', () => ({
	default: vi.fn(),
}));

vi.mock('remark-gfm', () => ({
	default: vi.fn(),
}));

vi.mock('../../src/lib/shared.js', () => ({
	shared: {
		mdxConfig: {
			remarkPlugins: [],
			rehypePlugins: [],
			recmaPlugins: [],
			remarkRehypeOptions: {},
		},
	},
}));

const localSuiteName = 'renderMDX Function Tests';

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('should render simple MDX content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step('Should render simple MDX content correctly', async (ctx) => {
			const mockContent = createMockMDXContent('# Hello World');
			const mockComponent = vi.fn(() => 'Hello World');

			await ctx.parameter('MDX Content', mockContent);

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: {},
				key: null,
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue('<h1>Hello World</h1>');

			const result = await renderMDX(mockContent);

			await ctx.parameter('Rendered Output', result);

			expect(evaluate).toHaveBeenCalledWith(
				mockContent,
				expect.objectContaining({
					remarkPlugins: expect.any(Array),
					rehypePlugins: expect.any(Array),
					recmaPlugins: expect.any(Array),
					remarkRehypeOptions: expect.any(Object),
				})
			);

			expect(createElement).toHaveBeenCalledWith(mockComponent);
			expect(renderToString).toHaveBeenCalled();
			expect(result).toBe('<h1>Hello World</h1>');
		});
	});

	test('should render MDX content with JSX components', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step('Should render MDX content with JSX components correctly', async (ctx) => {
			const mdxContent = `import { Button } from './Button';

# Hello World

<Button>Click me!</Button>`;

			const mockComponent = vi.fn(() => 'Hello World with Button');

			await ctx.parameter('MDX Content', mdxContent);

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: {},
				key: null,
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue(
				'<div><h1>Hello World</h1><button>Click me!</button></div>'
			);

			const result = await renderMDX(mdxContent);

			await ctx.parameter('Rendered Output', result);

			expect(evaluate).toHaveBeenCalledWith(
				mdxContent,
				expect.objectContaining({
					remarkPlugins: expect.any(Array),
					rehypePlugins: expect.any(Array),
					recmaPlugins: expect.any(Array),
					remarkRehypeOptions: expect.any(Object),
				})
			);

			expect(result).toBe('<div><h1>Hello World</h1><button>Click me!</button></div>');
		});
	});

	test('should handle empty content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step('Should handle empty MDX content correctly', async (ctx) => {
			await ctx.parameter('MDX Content', '(empty string)');

			const mockComponent = vi.fn(() => '');

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: {},
				key: null,
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue('');

			const result = await renderMDX('');

			await ctx.parameter('Rendered Output', result);

			expect(evaluate).toHaveBeenCalledWith('', expect.any(Object));
			expect(result).toBe('');
		});
	});

	test('should include base remark and rehype plugins', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step('Should include base plugins in MDX rendering options', async (ctx) => {
			const mockComponent = vi.fn(() => 'test');

			await ctx.parameter('MDX Content', 'test');

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: {},
				key: null,
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue('test');

			await renderMDX('test');

			const evaluateCall = vi.mocked(evaluate).mock.calls[0];
			const options = evaluateCall[1];

			expect(options.remarkPlugins).toHaveLength(1); // remark-gfm
			expect(options.rehypePlugins).toHaveLength(1); // rehype-highlight
		});
	});

	test('should use default shared config', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step('Should use default shared config for MDX rendering', async (ctx) => {
			await ctx.parameter('MDX Content', 'test');
			const mockComponent = vi.fn(() => 'test');

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: {},
				key: null,
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue('test');

			await renderMDX('test');

			const evaluateCall = vi.mocked(evaluate).mock.calls[0];
			const options = evaluateCall[1];

			expect(options.remarkPlugins).toHaveLength(1); // remark-gfm
			expect(options.rehypePlugins).toHaveLength(1); // rehype-highlight
			expect(options.recmaPlugins).toHaveLength(0); // no custom recma plugins
			expect(options.remarkRehypeOptions).toEqual({});
		});
	});

	test('should handle malformed MDX content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step('Should handle malformed MDX content gracefully', async (ctx) => {
			const malformedContent = `
# Broken MDX

<UnclosedTag>
This is broken JSX

import { Component } from 'react';
<Component prop="unclosed quote>
`;

			await ctx.parameter('MDX Content', malformedContent);

			const mockComponent = vi.fn(() => 'test');

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: {},
				key: null,
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue('test');

			await renderMDX(malformedContent);

			expect(evaluate).toHaveBeenCalledWith(malformedContent, expect.any(Object));
		});
	});

	test('should handle special characters and unicode content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		await allure.step(
			'Should handle special characters and unicode in MDX content',
			async (ctx) => {
				const unicodeContent = `# Hello World

This is **bold** with emojis

Math symbols and unicode text

Special chars: <>&"'`;

				await ctx.parameter('MDX Content', unicodeContent);

				const mockComponent = vi.fn(() => 'test');

				vi.mocked(evaluate).mockResolvedValue({
					default: mockComponent,
				});

				vi.mocked(createElement).mockReturnValue({
					type: mockComponent,
					props: {},
					key: null,
				} as unknown as ReactElement<
					Record<string, never>,
					string | JSXElementConstructor<unknown>
				>);

				vi.mocked(renderToString).mockReturnValue('test');

				await renderMDX(unicodeContent);

				expect(evaluate).toHaveBeenCalledWith(unicodeContent, expect.any(Object));
			}
		);
	});
});
