/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Renderer from '../../../src/virtuals/components/Renderer.astro';
import { cleanAstroAttributes, makeRendererProps } from '../../test-utils';

describe('Renderer component', () => {
	test('render component with content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Renderer, {
			props: makeRendererProps('<div>This is a test content from the defaultContent field.</div>'),
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/Renderer.astro');
		expect(cleanResult).toMatchSnapshot();
	});

	test('render component with no content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Renderer, {
			props: makeRendererProps(null),
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/Renderer.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
