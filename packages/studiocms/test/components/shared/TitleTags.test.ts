/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import TitleTags from '../../../src/components/shared/head/TitleTags.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('TitleTags component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(TitleTags, {
			locals: MockAstroLocals(),
			props: { title: 'Test Title', description: 'Test Description' },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/TitleTags.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
