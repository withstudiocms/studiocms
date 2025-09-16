/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import BaseHead from '../../src/components/BaseHead.astro';

describe('BaseHead component', () => {
	test('BaseHead with minimal props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(BaseHead, {
			props: {
				title: 'Test Title',
				description: 'Test Description',
			},
		});

		expect(result).toContain('<title>Test Title</title>');
		expect(result).toContain('<meta name="description" content="Test Description"/>');
		expect(result).toContain('<meta property="og:title" content="Test Title"/>');
		expect(result).toContain('<meta property="og:description" content="Test Description"/>');
		expect(result).toContain('<meta name="twitter:title" content="Test Title"/>');
		expect(result).toContain('<meta name="twitter:description" content="Test Description"/>');
		expect(result).toContain('<meta name="generator" content="StudioCMS v0.0.0-test"/>');
		expect(result).toContain('<meta name="generator" content="Astro');
		expect(result).toContain('<meta property="og:locale" content="en"/>');
	});

	test('BaseHead with all props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(BaseHead, {
			props: {
				title: 'Full Test Title',
				description: 'Full Test Description',
				image: 'https://example.com/test-image.png',
				lang: 'fr',
			},
		});

		expect(result).toContain('<title>Full Test Title</title>');
		expect(result).toContain('<meta name="description" content="Full Test Description"/>');
		expect(result).toContain('<meta property="og:title" content="Full Test Title"/>');

		expect(result).toContain('<meta property="og:description" content="Full Test Description"/>');
		expect(result).toContain(
			'<meta property="og:image" content="https://example.com/test-image.png"/>'
		);
		expect(result).toContain('<meta name="twitter:title" content="Full Test Title"/>');
		expect(result).toContain('<meta name="twitter:description" content="Full Test Description"/>');
		expect(result).toContain(
			'<meta name="twitter:image" content="https://example.com/test-image.png"/>'
		);
		expect(result).toContain('<meta property="og:locale" content="fr"/>');
	});
});
