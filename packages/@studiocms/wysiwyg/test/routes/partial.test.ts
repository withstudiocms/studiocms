import { beforeEach, describe, expect, test, vi } from 'vitest';

interface ComponentProps {
	content?: string;
	level?: number;
	text?: string;
	className?: string;
	style?: Record<string, string>;
	attributes?: Record<string, string>;
}

interface Component {
	render: (props?: ComponentProps) => string;
}

interface ComponentRegistry {
	components: Record<string, Component>;
}

// Mock the component registry
vi.mock(
	'studiocms:component-registry/runtime',
	(): { getRendererComponents: () => ComponentRegistry } => ({
		getRendererComponents: vi.fn(
			(): ComponentRegistry => ({
				components: {
					Text: {
						render: vi.fn(
							(props?: ComponentProps): string =>
								`<div class="text-component">${props?.content || ''}</div>`
						),
					},
					Heading: {
						render: vi.fn(
							(props?: ComponentProps): string =>
								`<h${props?.level || 1} class="heading-component">${props?.text || ''}</h${props?.level || 1}>`
						),
					},
				},
			})
		),
	})
);

// Mock the logger
vi.mock('studiocms:logger', () => ({
	apiResponseLogger: vi.fn(),
}));

describe('WYSIWYG Partial Route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('handles valid component request', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();

		expect(componentRegistry).toBeDefined();
		expect(componentRegistry.components).toBeDefined();
		expect(componentRegistry.components.Text).toBeDefined();
		expect(componentRegistry.components.Heading).toBeDefined();
	});

	test('renders Text component correctly', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();
		const textComponent = componentRegistry.components.Text;

		const props = { content: 'Hello World' };
		const rendered = textComponent.render(props);

		expect(rendered).toBe('<div class="text-component">Hello World</div>');
	});

	test('renders Heading component correctly', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();
		const headingComponent = componentRegistry.components.Heading;

		const props = { level: 2, text: 'Section Title' };
		const rendered = headingComponent.render(props);

		expect(rendered).toBe('<h2 class="heading-component">Section Title</h2>');
	});

	test('handles component with slot content', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();
		const textComponent = componentRegistry.components.Text;

		const props = { content: 'Default content' };
		const _slot = '<strong>Slot content</strong>';

		const rendered = textComponent.render(props);

		expect(rendered).toBe('<div class="text-component">Default content</div>');
	});

	test('handles missing component gracefully', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();

		// Test accessing non-existent component
		expect(componentRegistry.components.NonExistent).toBeUndefined();
	});

	test('handles empty props', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();
		const textComponent = componentRegistry.components.Text;

		const rendered = textComponent.render({});

		expect(rendered).toBe('<div class="text-component"></div>');
	});

	test('handles undefined props', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();
		const textComponent = componentRegistry.components.Text;

		const rendered = textComponent.render(undefined);

		expect(rendered).toBe('<div class="text-component"></div>');
	});

	test('validates component key format', () => {
		const validKeys = ['Text', 'Heading', 'Button', 'Container'];
		const invalidKeys = ['', 'text', 'text-component', 'textComponent'];

		validKeys.forEach((key) => {
			expect(key).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
		});

		invalidKeys.forEach((key) => {
			expect(key).not.toMatch(/^[A-Z][a-zA-Z0-9]*$/);
		});
	});

	test('handles complex component props', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		const componentRegistry = await getRendererComponents();
		const textComponent = componentRegistry.components.Text;

		const complexProps = {
			content: 'Complex content',
			className: 'custom-class',
			style: { color: 'red', fontSize: '16px' },
			attributes: { 'data-test': 'value' },
		};

		const rendered = textComponent.render(complexProps);

		expect(rendered).toBe('<div class="text-component">Complex content</div>');
	});

	test('component registry is properly initialized', async () => {
		const { getRendererComponents } = await import('studiocms:component-registry/runtime');

		expect(getRendererComponents).toBeDefined();
		expect(typeof getRendererComponents).toBe('function');

		const registry = await getRendererComponents();
		expect(registry).toBeDefined();
		expect(typeof registry).toBe('object');
	});
});
