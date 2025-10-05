/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import CustomImage from '../src/virtuals/components/CustomImage.astro';
import FormattedDate from '../src/virtuals/components/FormattedDate.astro';
import Generator from '../src/virtuals/components/Generator.astro';
import Renderer from '../src/virtuals/components/Renderer.astro';
import { test } from './fixtures/AstroContainer';
import { MockAstroLocals, makeRendererProps } from './test-utils';

describe('Virtual Components Container tests', () => {
	describe('CustomImage component', () => {
		test('render component', async ({ renderComponent }) => {
			const result = await renderComponent(CustomImage, 'CustomImage', {
				props: { src: 'https://seccdn.libravatar.org/static/img/mm/80.png', alt: 'Test Image' },
			});
			expect(result).toMatchSnapshot();
		});
	});

	describe('FormattedDate component', () => {
		test('render component', async ({ renderComponent }) => {
			const result = await renderComponent(FormattedDate, 'FormattedDate', {
				props: { date: new Date('2020-01-01'), __test_mode: true },
			});
			expect(result).toMatchSnapshot();
		});
	});

	describe('Generator component', () => {
		test('render component', async ({ renderComponent }) => {
			const result = await renderComponent(Generator, 'Generator', {
				props: { locals: MockAstroLocals() },
			});
			expect(result).toMatchSnapshot();
		});
	});

	describe('Renderer component', () => {
		test('render component with content', async ({ renderComponent }) => {
			const result = await renderComponent(Renderer, 'Renderer', {
				props: makeRendererProps(
					'<div>This is a test content from the defaultContent field.</div>'
				),
			});
			expect(result).toMatchSnapshot();
		});

		test('render component with no content', async ({ renderComponent }) => {
			const result = await renderComponent(Renderer, 'Renderer', {
				props: makeRendererProps(null),
			});
			expect(result).toMatchSnapshot();
		});
	});
});
