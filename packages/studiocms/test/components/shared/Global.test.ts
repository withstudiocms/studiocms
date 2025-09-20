/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Global from '../../../src/components/shared/head/Global.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('Global component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Global, {
			locals: MockAstroLocals(),
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/Global.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
