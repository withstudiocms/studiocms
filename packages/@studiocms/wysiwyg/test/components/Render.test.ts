/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import Render from '../../src/components/Render.astro';
import { test } from '../fixtures/AstroContainer';
import { makeRendererProps } from '../test-utils';

describe('WYSIWYG Render Component', () => {
	test('renders basic content', async ({ renderComponent }) => {
		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps('<p>Hello World</p>'),
		});
		expect(result).toMatchSnapshot();
	});

	test('renders complex HTML content', async ({ renderComponent }) => {
		const complexContent = `
			<div class="article">
				<h1>Main Title</h1>
				<p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
				<ul>
					<li>Item 1</li>
					<li>Item 2</li>
				</ul>
			</div>
		`;

		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps(complexContent),
		});
		expect(result).toMatchSnapshot();
	});

	test('handles empty content', async ({ renderComponent }) => {
		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps(''),
		});
		expect(result).toMatchSnapshot();
	});

	test('handles null content', async ({ renderComponent }) => {
		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps(null),
		});
		expect(result).toMatchSnapshot();
	});

	test('handles undefined content', async ({ renderComponent }) => {
		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps(null),
		});
		expect(result).toMatchSnapshot();
	});

	test('renders content with special characters', async ({ renderComponent }) => {
		const specialContent = `
			<div>
				<h1>Special Characters: &lt; &gt; &amp; &quot; &#39;</h1>
				<p>Math: 2 &lt; 3 &amp; 4 &gt; 1</p>
			</div>
		`;

		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps(specialContent),
		});
		expect(result).toMatchSnapshot();
	});

	test('renders content with links', async ({ renderComponent }) => {
		const contentWithLinks = `
			<div>
				<h1>Links Test</h1>
				<p>Visit <a href="https://example.com" class="external-link">Example</a> for more info.</p>
			</div>
		`;

		const result = await renderComponent(Render, 'Render', {
			props: makeRendererProps(contentWithLinks),
		});
		expect(result).toMatchSnapshot();
	});
});
