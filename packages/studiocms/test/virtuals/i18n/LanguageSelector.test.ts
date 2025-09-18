/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import LanguageSelector from '../../../src/virtuals/i18n/LanguageSelector.astro';
import { cleanAstroAttributes } from '../../test-utils';

describe('i18n Language Selector component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(LanguageSelector);
		const cleanResult = cleanAstroAttributes(result, '/mock/path/LanguageSelector.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
