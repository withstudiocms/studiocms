/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import CustomImage from '../../../src/virtuals/components/CustomImage.astro';
import { cleanAstroAttributes } from '../../test-utils';

describe('CustomImage component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(CustomImage, {
			props: { src: 'https://seccdn.libravatar.org/static/img/mm/80.png', alt: 'Test Image' },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/CustomImage.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
