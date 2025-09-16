/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Navigation from '../../src/components/Navigation.astro';
import { MockAstroLocals } from '../test-utils';

describe('Navigation component', () => {
	test('Navigation renders correctly', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Navigation, {
			locals: MockAstroLocals(),
		});

		expect(result).toMatch(/<div class="navigation".*?>/);
		expect(result).toMatch(/<a href="\/".*?>Test Site<\/a>/);
	});
});
