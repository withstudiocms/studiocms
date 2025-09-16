import type { JSXElementConstructor, ReactElement } from 'react';
import type { PluggableList } from 'unified';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMDX } from '../../src/lib/render.js';
import { createMockMDXContent } from '../test-utils.js';

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

describe('renderMDX', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should render simple MDX content', async () => {
		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		const mockContent = createMockMDXContent('# Hello World');
		const mockComponent = vi.fn(() => 'Hello World');

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

	it('should render MDX content with JSX components', async () => {
		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		const mdxContent = `import { Button } from './Button';

# Hello World

<Button>Click me!</Button>`;

		const mockComponent = vi.fn(() => 'Hello World with Button');

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

	it('should handle empty content', async () => {
		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

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

		expect(evaluate).toHaveBeenCalledWith('', expect.any(Object));
		expect(result).toBe('');
	});

	it('should include base remark and rehype plugins', async () => {
		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

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
	});

	it('should use default shared config', async () => {
		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

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

	it('should handle evaluation errors gracefully', async () => {
		const { evaluate } = await import('@mdx-js/mdx');

		vi.mocked(evaluate).mockRejectedValue(new Error('MDX evaluation failed'));

		await expect(renderMDX('invalid mdx')).rejects.toThrow('MDX evaluation failed');
	});

	it('should handle render errors gracefully', async () => {
		const { evaluate } = await import('@mdx-js/mdx');
		const { renderToString } = await import('react-dom/server');
		const { createElement } = await import('react');

		const mockComponent = vi.fn(() => 'test');

		vi.mocked(evaluate).mockResolvedValue({
			default: mockComponent,
		});

		vi.mocked(createElement).mockReturnValue({
			type: mockComponent,
			props: {},
			key: null,
		} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

		vi.mocked(renderToString).mockImplementation(() => {
			throw new Error('Render failed');
		});

		await expect(renderMDX('test')).rejects.toThrow('Render failed');
	});

	describe('Edge cases', () => {
		it('should handle empty plugin arrays', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

			// Mock shared config with empty plugin arrays
			const { shared } = await import('../../src/lib/shared.js');
			shared.mdxConfig = {
				remarkPlugins: [],
				rehypePlugins: [],
				recmaPlugins: [],
				remarkRehypeOptions: {},
			};

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

			expect(options.remarkPlugins).toHaveLength(1); // base remark-gfm
			expect(options.rehypePlugins).toHaveLength(1); // base rehype-highlight
			expect(options.recmaPlugins).toHaveLength(0); // empty array
		});

		it('should handle null/undefined plugin configurations', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

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

			// Test with null content
			await renderMDX('');

			// Test with whitespace-only content
			await renderMDX('   \n\t   ');

			// Test with very long content
			const longContent = '# Title\n\n' + 'A'.repeat(10000);
			await renderMDX(longContent);

			expect(evaluate).toHaveBeenCalledTimes(3);
		});

		it('should handle malformed MDX content', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

			const malformedContent = `
# Broken MDX

<UnclosedTag>
This is broken JSX

import { Component } from 'react';
<Component prop="unclosed quote>
`;

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

		it('should handle special characters and unicode content', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

			const unicodeContent = `# Hello World

This is **bold** with emojis

Math symbols and unicode text

Special chars: <>&"'`;

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

			await renderMDX(unicodeContent);

			expect(evaluate).toHaveBeenCalledWith(unicodeContent, expect.any(Object));
		});

		it('should handle complex JSX with nested components', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

			const complexJSX = `import { Button, Card, Modal } from './components';

# Complex Component Test

<Card title="Test Card">
  <p>This is a complex component test.</p>
  <Button onClick={() => alert('clicked')}>
    Click me
  </Button>
  <Modal isOpen={true}>
    <h2>Modal Content</h2>
    <p>This is inside a modal.</p>
  </Modal>
</Card>`;

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

			await renderMDX(complexJSX);

			expect(evaluate).toHaveBeenCalledWith(complexJSX, expect.any(Object));
		});

		it('should handle makeList function with empty userDefinedPlugins', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

			// Mock shared config with empty arrays to test makeList edge case
			const { shared } = await import('../../src/lib/shared.js');
			shared.mdxConfig = {
				remarkPlugins: [],
				rehypePlugins: [],
				recmaPlugins: [],
				remarkRehypeOptions: {},
			};

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

			// Should still include base plugins even with empty user arrays
			expect(options.remarkPlugins).toHaveLength(1); // remark-gfm
			expect(options.rehypePlugins).toHaveLength(1); // rehype-highlight
		});

		it('should handle runtime errors in MDX evaluation', async () => {
			const { evaluate } = await import('@mdx-js/mdx');

			// Test different types of evaluation errors
			vi.mocked(evaluate).mockRejectedValue(new SyntaxError('Invalid MDX syntax'));
			await expect(renderMDX('invalid syntax')).rejects.toThrow('Invalid MDX syntax');

			vi.mocked(evaluate).mockRejectedValue(new TypeError('Type error in MDX'));
			await expect(renderMDX('type error')).rejects.toThrow('Type error in MDX');

			vi.mocked(evaluate).mockRejectedValue(new ReferenceError('Undefined variable'));
			await expect(renderMDX('undefined var')).rejects.toThrow('Undefined variable');
		});

		it('should handle React rendering edge cases', async () => {
			const { evaluate } = await import('@mdx-js/mdx');
			const { renderToString } = await import('react-dom/server');
			const { createElement } = await import('react');

			const mockComponent = vi.fn(() => 'test');

			vi.mocked(evaluate).mockResolvedValue({
				default: mockComponent,
			});

			// Test with different React element structures
			vi.mocked(createElement).mockReturnValue({
				type: mockComponent,
				props: { className: 'test-class', id: 'test-id' },
				key: 'test-key',
			} as unknown as ReactElement<Record<string, never>, string | JSXElementConstructor<unknown>>);

			vi.mocked(renderToString).mockReturnValue('<div class="test-class" id="test-id">test</div>');

			const result = await renderMDX('test');

			expect(result).toBe('<div class="test-class" id="test-id">test</div>');
			expect(createElement).toHaveBeenCalledWith(mockComponent);
		});
	});
});
