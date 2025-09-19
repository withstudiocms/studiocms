/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import SSRUser from '../../../src/components/shared/SSRUser.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('SSRUser component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(SSRUser, {
			locals: MockAstroLocals(),
			props: { name: 'mock', description: 'mock-admin' },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/SSRUser.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
