/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import StudioCMSLogoSVG from '../../../src/components/auth/StudioCMSLogoSVG.astro';
import { cleanAstroAttributes } from '../../test-utils';

describe('StudioCMSLogoSVG component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(StudioCMSLogoSVG);
		const cleanResult = cleanAstroAttributes(result, '/mock/path/StudioCMSLogoSVG.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
