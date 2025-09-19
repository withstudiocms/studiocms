/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Generator from '../../../src/virtuals/components/Generator.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('Generator component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Generator, { locals: MockAstroLocals() });
		const cleanResult = cleanAstroAttributes(result, '/mock/path/Generator.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
