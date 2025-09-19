/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import OAuthButtonStack from '../../../src/components/auth/OAuthButtonStack.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('OAuthButtonStack component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(OAuthButtonStack, {
			locals: MockAstroLocals(),
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/OAuthButtonStack.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
