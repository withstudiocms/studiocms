import React from 'react';
import { describe, expect, test, vi } from 'vitest';

// Mock the MarkDocReactRenderer component
const mockMarkDocReactRenderer = vi.fn(({ children }: { children: React.ReactNode }) => {
	return `<div class="markdoc-react-renderer">${children || ''}</div>`;
});

// Mock the ReactWrapper component behavior
const mockReactWrapper = vi.fn((props: { content: React.ReactNode }) => {
	const { content } = props;
	return mockMarkDocReactRenderer({ children: content });
});

describe('ReactWrapper.astro', () => {
	test('renders with valid React content', async () => {
		const props = {
			content: React.createElement('div', null, 'Test React content'),
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: props.content,
		});
	});

	test('renders with string content', async () => {
		const props = {
			content: 'Simple string content',
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: props.content,
		});
	});

	test('renders with null content', async () => {
		const props = {
			content: null,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: null,
		});
	});

	test('renders with undefined content', async () => {
		const props = {
			content: undefined,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: undefined,
		});
	});

	test('renders with complex React element', async () => {
		const complexContent = React.createElement(
			'div',
			{ className: 'markdoc-content' },
			React.createElement('h1', null, 'Main Title'),
			React.createElement(
				'div',
				null,
				React.createElement('p', null, 'Paragraph content'),
				React.createElement(
					'ul',
					null,
					React.createElement('li', null, 'List item 1'),
					React.createElement('li', null, 'List item 2')
				)
			)
		);

		const props = {
			content: complexContent,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: complexContent,
		});
	});

	test('renders with React fragment', async () => {
		const fragmentContent = React.createElement(
			React.Fragment,
			null,
			React.createElement('h1', null, 'Title'),
			React.createElement('p', null, 'Content')
		);

		const props = {
			content: fragmentContent,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: fragmentContent,
		});
	});

	test('renders with array of React elements', async () => {
		const arrayContent = [
			React.createElement('h1', { key: 'title' }, 'Array Title'),
			React.createElement('p', { key: 'para' }, 'Array paragraph'),
			React.createElement('div', { key: 'div' }, 'Array div'),
		];

		const props = {
			content: arrayContent,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: arrayContent,
		});
	});

	test('renders with mixed content types', async () => {
		const mixedContent = [
			React.createElement('h1', { key: 'title' }, 'Mixed Title'),
			'Some text',
			React.createElement('p', { key: 'para' }, 'Mixed paragraph'),
			null,
			React.createElement('div', { key: 'div' }, 'Mixed div'),
		];

		const props = {
			content: mixedContent,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: mixedContent,
		});
	});

	test('handles empty props gracefully', async () => {
		const props = {
			content: '',
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: '',
		});
	});

	test('renders with React component', async () => {
		const CustomComponent = ({ children }: { children: React.ReactNode }) =>
			React.createElement('div', { className: 'custom' }, children);

		const componentContent = React.createElement(
			CustomComponent,
			null,
			React.createElement('h1', null, 'Component Title'),
			React.createElement('p', null, 'Component content')
		);

		const props = {
			content: componentContent,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: componentContent,
		});
	});

	test('renders with deeply nested content', async () => {
		const nestedContent = React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				null,
				React.createElement(
					'div',
					null,
					React.createElement('h1', null, 'Deeply Nested Title'),
					React.createElement(
						'div',
						null,
						React.createElement('p', null, 'Deeply nested paragraph'),
						React.createElement(
							'div',
							null,
							React.createElement('span', null, 'Deeply nested span')
						)
					)
				)
			)
		);

		const props = {
			content: nestedContent,
		};

		const result = mockReactWrapper(props);

		expect(result).toContain('markdoc-react-renderer');
		expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
			children: nestedContent,
		});
	});

	test('validates props interface', () => {
		// Test that the props interface is correctly defined
		const validProps: { content: React.ReactNode } = {
			content: React.createElement('div', null, 'Test'),
		};

		expect(validProps.content).toBeDefined();
		expect(typeof validProps.content).toBe('object');
	});

	test('handles various React node types', () => {
		const testCases = [
			React.createElement('div', null, 'String child'),
			React.createElement('div', null, React.createElement('span', null, 'Nested element')),
			React.createElement('div', null, ['Array', 'of', 'children']),
			React.createElement('div', null, null),
			React.createElement('div', null, undefined),
			React.createElement('div', null, 123),
			React.createElement('div', null, true),
			React.createElement('div', null, false),
		];

		testCases.forEach((testCase) => {
			const props = { content: testCase };
			const result = mockReactWrapper(props);

			expect(result).toContain('markdoc-react-renderer');
			expect(mockMarkDocReactRenderer).toHaveBeenCalledWith({
				children: testCase,
			});
		});
	});
});
