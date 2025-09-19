/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import CustomImage from '../../../src/virtuals/components/CustomImage.astro';
import FormattedDate from '../../../src/virtuals/components/FormattedDate.astro';
import Generator from '../../../src/virtuals/components/Generator.astro';
import Renderer from '../../../src/virtuals/components/Renderer.astro';
import { cleanAstroAttributes, MockAstroLocals, makeRendererProps } from '../../test-utils';

describe('Virtual Components Container tests', () => {
	let container: AstroContainer;

	beforeAll(async () => {
		container = await AstroContainer.create();
	});

	describe('CustomImage component', () => {
		test('render component', async () => {
			const result = await container.renderToString(CustomImage, {
				props: { src: 'https://seccdn.libravatar.org/static/img/mm/80.png', alt: 'Test Image' },
			});
			const cleanResult = cleanAstroAttributes(result, '/mock/path/CustomImage.astro');
			expect(cleanResult).toMatchSnapshot();
		});
	});

	describe('FormattedDate component', () => {
		test('render component', async () => {
			const result = await container.renderToString(FormattedDate, {
				props: { date: new Date('2020-01-01'), __test_mode: true },
			});
			const cleanResult = cleanAstroAttributes(result, '/mock/path/FormattedDate.astro');
			expect(cleanResult).toMatchSnapshot();
		});
	});

	describe('Generator component', () => {
		test('render component', async () => {
			const result = await container.renderToString(Generator, { locals: MockAstroLocals() });
			const cleanResult = cleanAstroAttributes(result, '/mock/path/Generator.astro');
			expect(cleanResult).toMatchSnapshot();
		});
	});

	describe('Renderer component', () => {
		test('render component with content', async () => {
			const result = await container.renderToString(Renderer, {
				props: makeRendererProps(
					'<div>This is a test content from the defaultContent field.</div>'
				),
			});
			const cleanResult = cleanAstroAttributes(result, '/mock/path/Renderer.astro');
			expect(cleanResult).toMatchSnapshot();
		});

		test('render component with no content', async () => {
			const result = await container.renderToString(Renderer, {
				props: makeRendererProps(null),
			});
			const cleanResult = cleanAstroAttributes(result, '/mock/path/Renderer.astro');
			expect(cleanResult).toMatchSnapshot();
		});
	});
});
