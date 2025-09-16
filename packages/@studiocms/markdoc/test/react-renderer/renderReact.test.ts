import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type markdocReactComponents, renderReact } from '../../src/react-renderer/renderReact';

// Mock dependencies
vi.mock('@astrojs/react/server.js', () => ({
	default: vi.fn(),
}));

vi.mock('@markdoc/markdoc', () => ({
	default: {
		renderers: {
			react: vi.fn((_content: unknown, React: any, _options: unknown) => {
				return React.createElement('div', { className: 'markdoc-content' }, 'Rendered content');
			}),
		},
	},
}));

vi.mock('astro/container', () => ({
	experimental_AstroContainer: {
		create: vi.fn().mockResolvedValue({
			addServerRenderer: vi.fn(),
			addClientRenderer: vi.fn(),
			renderToString: vi
				.fn()
				.mockResolvedValue('<div class="markdoc-content">Rendered content</div>'),
		}),
	},
}));

vi.mock('react', () => ({
	default: vi.fn(),
	createElement: vi.fn((type: any, props: any, ...children: any[]) => ({
		type,
		props: { ...props, children },
	})),
}));

vi.mock('../../src/react-renderer/ReactWrapper.astro', () => ({
	default: 'ReactWrapper',
}));

describe('renderReact', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('creates a MarkDoc renderer with correct name', () => {
		const renderer = renderReact();

		expect(renderer).toBeDefined();
		expect(renderer.name).toBe('react');
		expect(typeof renderer.render).toBe('function');
	});

	test('creates renderer with custom components', () => {
		const components: markdocReactComponents = {
			Button: 'button',
			Card: 'div',
		};

		const renderer = renderReact(components);

		expect(renderer).toBeDefined();
		expect(renderer.name).toBe('react');
		expect(typeof renderer.render).toBe('function');
	});

	test('renders content correctly', async () => {
		const { experimental_AstroContainer } = await import('astro/container');
		const { default: Markdoc } = await import('@markdoc/markdoc');
		const React = await import('react');

		const renderer = renderReact();
		const mockContent = { type: 'document', children: [] };

		const result = await renderer.render(mockContent);

		expect(result).toBe('<div class="markdoc-content">Rendered content</div>');
		expect(experimental_AstroContainer.create).toHaveBeenCalled();
		expect(Markdoc.renderers.react).toHaveBeenCalledWith(mockContent, React, {
			components: undefined,
		});
	});

	test('renders content with custom components', async () => {
		const { default: Markdoc } = await import('@markdoc/markdoc');
		const React = await import('react');

		const components: markdocReactComponents = {
			Button: 'button',
			Card: 'div',
		};

		const renderer = renderReact(components);
		const mockContent = { type: 'document', children: [] };

		const result = await renderer.render(mockContent);

		expect(result).toBe('<div class="markdoc-content">Rendered content</div>');
		expect(Markdoc.renderers.react).toHaveBeenCalledWith(mockContent, React, { components });
	});

	test('handles container creation and configuration', async () => {
		const { default: reactRenderer } = await import('@astrojs/react/server.js');
		const { experimental_AstroContainer } = await import('astro/container');

		const renderer = renderReact();
		const mockContent = { type: 'document', children: [] };

		await renderer.render(mockContent);

		const mockContainer = await experimental_AstroContainer.create();

		expect(mockContainer.addServerRenderer).toHaveBeenCalledWith({
			name: '@astrojs/react',
			renderer: reactRenderer,
		});

		expect(mockContainer.addClientRenderer).toHaveBeenCalledWith({
			name: '@astrojs/react',
			entrypoint: '@astrojs/react/client.js',
		});
	});

	test('handles renderToString with correct props', async () => {
		const { default: Markdoc } = await import('@markdoc/markdoc');
		const React = await import('react');
		const { experimental_AstroContainer } = await import('astro/container');

		const renderer = renderReact();
		const mockContent = { type: 'document', children: [{ type: 'heading', level: 1 }] };

		await renderer.render(mockContent);

		const mockContainer = await experimental_AstroContainer.create();
		expect(mockContainer.renderToString).toHaveBeenCalledWith('ReactWrapper', {
			props: {
				content: expect.any(Object), // React element
			},
		});
	});

	test('handles undefined components', async () => {
		const { default: Markdoc } = await import('@markdoc/markdoc');
		const React = await import('react');

		const renderer = renderReact(undefined);
		const mockContent = { type: 'document', children: [] };

		await renderer.render(mockContent);

		expect(Markdoc.renderers.react).toHaveBeenCalledWith(mockContent, React, {
			components: undefined,
		});
	});

	test('handles empty components object', async () => {
		const { default: Markdoc } = await import('@markdoc/markdoc');
		const React = await import('react');

		const renderer = renderReact({});
		const mockContent = { type: 'document', children: [] };

		await renderer.render(mockContent);

		expect(Markdoc.renderers.react).toHaveBeenCalledWith(mockContent, React, { components: {} });
	});

	test('handles complex content structure', async () => {
		const renderer = renderReact();
		const complexContent = {
			type: 'document',
			children: [
				{ type: 'heading', level: 1, children: [{ type: 'text', content: 'Title' }] },
				{ type: 'paragraph', children: [{ type: 'text', content: 'Content' }] },
				{
					type: 'list',
					children: [{ type: 'listItem', children: [{ type: 'text', content: 'Item' }] }],
				},
			],
		};

		const result = await renderer.render(complexContent as any);

		expect(result).toBe('<div class="markdoc-content">Rendered content</div>');
	});

	test('handles async rendering', async () => {
		// Mock async behavior
		const asyncMockContainer = {
			addServerRenderer: vi.fn(),
			addClientRenderer: vi.fn(),
			renderToString: vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return '<div class="markdoc-content">Async rendered content</div>';
			}),
			renderToResponse: vi.fn(),
			insertPageRoute: vi.fn(),
		} as unknown as Awaited<ReturnType<typeof experimental_AstroContainer.create>>;

		const { experimental_AstroContainer } = await import('astro/container');
		vi.mocked(experimental_AstroContainer.create).mockResolvedValueOnce(asyncMockContainer);

		const renderer = renderReact();
		const mockContent = { type: 'document', children: [] };

		const result = await renderer.render(mockContent);

		expect(result).toBe('<div class="markdoc-content">Async rendered content</div>');
		expect(asyncMockContainer.renderToString).toHaveBeenCalled();
	});
});
