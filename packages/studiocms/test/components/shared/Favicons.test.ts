/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Favicons from '../../../src/components/shared/head/Favicons.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('Favicons component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Favicons, {
			locals: MockAstroLocals(),
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/Favicons.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
