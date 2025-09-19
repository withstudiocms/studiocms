/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import ThemeManager from '../../../src/components/shared/ThemeManager.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('ThemeManager component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(ThemeManager, { locals: MockAstroLocals() });
		const cleanResult = cleanAstroAttributes(result, '/mock/path/ThemeManager.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
