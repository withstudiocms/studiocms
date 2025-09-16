import React from 'react';
import { describe, expect, test } from 'vitest';
import { MarkDocReactRenderer } from '../../src/react-renderer/MarkDocReactRenderer';

describe('MarkDocReactRenderer', () => {
	test('renders children correctly', () => {
		const children = <div>Test content</div>;
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(children);
	});

	test('renders multiple children', () => {
		const children = (
			<>
				<h1>Title</h1>
				<p>Content</p>
			</>
		);
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(children);
	});

	test('renders string children', () => {
		const children = 'Simple text content';
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(children);
	});

	test('renders null children', () => {
		const children = null;
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(null);
	});

	test('renders undefined children', () => {
		const children = undefined;
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(undefined);
	});

	test('renders complex nested children', () => {
		const children = (
			<div>
				<h1>Main Title</h1>
				<div>
					<p>Paragraph 1</p>
					<p>Paragraph 2</p>
					<ul>
						<li>Item 1</li>
						<li>Item 2</li>
					</ul>
				</div>
			</div>
		);
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(children);
	});

	test('renders with React elements', () => {
		const children = React.createElement('div', { className: 'test' }, 'Test content');
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toBe(children);
	});

	test('renders with mixed content types', () => {
		const children = [
			<h1 key="title">Title</h1>,
			'Some text',
			<p key="para">Paragraph</p>,
			null,
			<div key="div">Div content</div>,
		];
		const result = MarkDocReactRenderer({ children });

		expect(result).toBeDefined();
		expect(result.type).toBe(React.Fragment);
		expect(result.props.children).toEqual(children);
	});
});
