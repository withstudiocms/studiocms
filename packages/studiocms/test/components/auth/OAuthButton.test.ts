/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import OAuthButton from '../../../src/components/auth/OAuthButton.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('OAuthButton component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(OAuthButton, {
			locals: MockAstroLocals(),
			props: {
				label: 'test auth',
				href: '/test/endpoint',
				image: '<img src="/fake/image.jpg">',
			},
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/OAuthButton.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
