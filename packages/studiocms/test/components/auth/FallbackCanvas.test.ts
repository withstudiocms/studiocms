/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import FallbackCanvas from '../../../src/components/auth/FallbackCanvas.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('FallbackCanvas component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(FallbackCanvas, { locals: MockAstroLocals() });
		const cleanResult = cleanAstroAttributes(result, '/mock/path/FallbackCanvas.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
