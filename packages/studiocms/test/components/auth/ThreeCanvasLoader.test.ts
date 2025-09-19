/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import ThreeCanvasLoader from '../../../src/components/auth/ThreeCanvasLoader.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('ThreeCanvasLoader component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(ThreeCanvasLoader, { locals: MockAstroLocals() });
		const cleanResult = cleanAstroAttributes(result, '/mock/path/ThreeCanvasLoader.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
