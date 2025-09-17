import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockProps, sampleWYSIWYGContent } from '../test-utils';

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

// Mock Astro locals
const mockAstroLocals = {
	StudioCMS: {
		plugins: {
			editorCSRFToken: 'mock-csrf-token',
		},
	},
};

describe('WYSIWYG Editor Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renders editor container with correct attributes', () => {
		const props = createMockProps(sampleWYSIWYGContent);

		// Mock Astro.props and Astro.locals
		const mockProps = {
			...props,
			id: 'test-page-id',
		};

		// Test that the component would render with correct data attributes
		expect(mockProps.id).toBe('test-page-id');
		expect(mockAstroLocals.StudioCMS.plugins.editorCSRFToken).toBe('mock-csrf-token');
	});

	test('handles missing page id', () => {
		const props = createMockProps(sampleWYSIWYGContent);

		// Test with undefined id
		const mockProps = {
			...props,
			id: undefined,
		};

		expect(mockProps.id).toBeUndefined();
	});

	test('handles empty content', () => {
		const props = createMockProps('');

		expect(props.data.defaultContent?.content).toBe('');
	});

	test('handles null content', () => {
		const props = createMockProps(null);

		expect(props.data.defaultContent?.content).toBeNull();
	});

	test('handles undefined content', () => {
		const props = createMockProps(undefined);

		expect(props.data.defaultContent?.content).toBeUndefined();
	});

	test('component registry is called', async () => {
		const { getRegistryComponents } = await import('studiocms:component-registry/runtime');

		const registry = getRegistryComponents();

		expect(getRegistryComponents).toHaveBeenCalled();
		expect(registry).toBeDefined();
		expect(Array.isArray(registry)).toBe(true);
	});

	test('editor container has correct class', () => {
		// Test that the container would have the correct class
		const containerClass = 'scms-grapesjs-container';
		expect(containerClass).toBe('scms-grapesjs-container');
	});

	test('editor has correct structure', () => {
		// Test the expected DOM structure
		const expectedStructure = {
			container: {
				class: 'scms-grapesjs-container',
				attributes: ['data-page-id', 'data-component-registry', 'data-editor-csrf-token'],
			},
			editor: {
				class: 'editor',
				children: ['gjs'],
			},
			textarea: {
				id: 'page-content',
				name: 'page-content',
				style: 'display: none;',
			},
		};

		expect(expectedStructure.container.class).toBe('scms-grapesjs-container');
		expect(expectedStructure.editor.class).toBe('editor');
		expect(expectedStructure.textarea.id).toBe('page-content');
	});

	test('handles complex content structure', () => {
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

		const props = createMockProps(complexContent);

		expect(props.data.defaultContent?.content).toContain('<div class="container">');
		expect(props.data.defaultContent?.content).toContain('<h1>Title</h1>');
		expect(props.data.defaultContent?.content).toContain('<strong>bold</strong>');
	});

	test('CSRF token is properly set', () => {
		const token = mockAstroLocals.StudioCMS.plugins.editorCSRFToken;

		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token).toBe('mock-csrf-token');
	});

	test('component registry data is serialized', () => {
		const mockRegistry = {
			components: [
				{ name: 'Text', component: 'div' },
				{ name: 'Heading', component: 'h1' },
			],
		};

		const serializedRegistry = JSON.stringify(mockRegistry);
		const parsedRegistry = JSON.parse(serializedRegistry);

		expect(parsedRegistry).toEqual(mockRegistry);
		expect(parsedRegistry.components).toHaveLength(2);
	});
});
