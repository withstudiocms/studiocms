/// <reference types="astro/client" />
import { describe, expect, vi } from 'vitest';
import Editor from '../../src/components/Editor.astro';
import { test } from '../fixtures/AstroContainer';
import { MockAstroLocalsWithCSRF } from '../test-utils';

// Mock the component registry
vi.mock('studiocms:component-registry/runtime', () => ({
	getRegistryComponents: vi.fn(() => [
		{
			name: 'Text',
			safeName: 'text',
			props: [
				{
					name: 'class',
					type: 'string',
					optional: true,
					description: 'CSS class for the text component',
				},
			],
		},
		{
			name: 'Heading',
			safeName: 'heading',
			props: [
				{
					name: 'class',
					type: 'string',
					optional: true,
					description: 'CSS class for the heading component',
				},
				{
					name: 'level',
					type: 'number',
					optional: true,
					defaultValue: '1',
					description: 'Heading level (1-6)',
				},
			],
		},
	]),
}));

// No need to mock Astro - we'll use Container API to pass locals directly

describe('WYSIWYG Editor Component', () => {
	test('renders editor with basic content', async ({ renderComponent }) => {
		const result = await renderComponent(Editor, 'Editor', {
			props: {
				content: '<p>Hello World</p>',
				id: 'test-page-id',
			},
		});
		expect(result).toMatchSnapshot();
	});

	test('renders editor without page id', async ({ renderComponent }) => {
		const result = await renderComponent(Editor, 'Editor', {
			props: {
				content: '<h1>Title</h1>',
			},
		});
		expect(result).toMatchSnapshot();
	});

	test('renders editor with empty content', async ({ renderComponent }) => {
		const result = await renderComponent(Editor, 'Editor', {
			props: {
				content: '',
				id: 'empty-page',
			},
		});
		expect(result).toMatchSnapshot();
	});

	test('renders editor with complex HTML content', async ({ renderComponent }) => {
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

		const result = await renderComponent(Editor, 'Editor', {
			props: {
				content: complexContent,
				id: 'complex-page',
			},
		});
		expect(result).toMatchSnapshot();
	});

	test('renders editor with CSRF token', async ({ renderComponent }) => {
		const result = await renderComponent(Editor, 'Editor', {
			props: {
				content: '<p>Test</p>',
				id: 'csrf-test',
			},
			locals: MockAstroLocalsWithCSRF('mock-csrf-token'),
		});
		expect(result).toMatchSnapshot();
	});
});
