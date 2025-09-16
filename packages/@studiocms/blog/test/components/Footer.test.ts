/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Footer from '../../src/components/Footer.astro';

describe('Footer component', () => {
	test('Footer renders correctly', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Footer, { props: { siteTitle: 'Test Site' } });

		expect(result).toMatch(/<footer.*?>/);
		expect(result).toMatch(
			/<span id="footer-year".*?>2025<\/span> Test Site\. All rights reserved\./
		);
		expect(result).toMatch(/<\/footer>/);
	});
});
