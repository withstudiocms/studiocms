/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import StaticAuthCheck from '../../../src/components/auth/StaticAuthCheck.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('StaticAuthCheck component', () => {
	test('render component no props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(StaticAuthCheck, { locals: MockAstroLocals() });
		const cleanResult = cleanAstroAttributes(result, '/mock/path/StaticAuthCheck.astro');
		expect(cleanResult).toMatchSnapshot();
	});
	test('render component with props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(StaticAuthCheck, {
			locals: MockAstroLocals(),
			props: { userData: { isLoggedIn: true } },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/StaticAuthCheck.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
