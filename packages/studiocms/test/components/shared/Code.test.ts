/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Code from '../../../src/components/shared/Code.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('Code component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Code, {
			locals: MockAstroLocals(),
			props: { code: 'export const hello = "hello world!";', __test_mode: true },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/Code.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
