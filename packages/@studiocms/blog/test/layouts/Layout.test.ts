/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Layout from '../../src/layouts/Layout.astro';
import { MockAstroLocals } from '../test-utils';

describe('Layout component', () => {
	test('Layout renders correctly', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Layout, {
			props: {
				title: 'Test Page',
				description: 'This is a test page',
			},
			locals: MockAstroLocals(),
		});

		expect(result).toMatch(/<html lang="en">/);
		expect(result).toMatch(/<head>[\s\S]*<\/head>/);
		expect(result).toMatch(/<meta charset="utf-8"\/>/);
		expect(result).toMatch(
			/<meta name="viewport" content="width=device-width, initial-scale=1"\/>/
		);
		expect(result).toMatch(/<title>Test Page \| Test Site<\/title>/);
		expect(result).toMatch(/<link rel="canonical" href="https:\/\/example.com\/"\/>/);
		expect(result).toMatch(/<link rel="preconnect" href="https:\/\/fonts.googleapis.com"\/>/);
		expect(result).toMatch(
			/<link rel="preconnect" href="https:\/\/fonts.gstatic.com" crossorigin\/>/
		);
		expect(result).toMatch(
			/<link href="https:\/\/fonts.googleapis.com\/css2\?family=Atkinson\+Hyperlegible:wght@400;700&display=swap" rel="stylesheet"\/>/
		);
		expect(result).toMatch(
			/<link rel="shortcut icon" href="\/favicon.svg" type="image\/svg\+xml"\/>/
		);
		expect(result).toMatch(/<meta name="title" content="Test Page \| Test Site"\/>/);
		expect(result).toMatch(
			/<meta name="description" content="This is a test page - A test site for StudioCMS"\/>/
		);
		expect(result).toMatch(/<meta name="generator" content="Astro v5.13.7"\/>/);
		expect(result).toMatch(/<meta name="generator" content="StudioCMS v0.0.0-test"\/>/);
		expect(result).toMatch(/<meta property="og:title" content="Test Page \| Test Site"\/>/);
		expect(result).toMatch(/<meta property="og:type" content="website"\/>/);
		expect(result).toMatch(/<meta property="og:url" content="https:\/\/example.com\/"\/>/);
		expect(result).toMatch(/<meta property="og:locale" content="en"\/>/);
		expect(result).toMatch(
			/<meta property="og:description" content="This is a test page - A test site for StudioCMS"\/>/
		);
		expect(result).toMatch(/<meta property="og:site_name" content="Test Page \| Test Site"\/>/);
		expect(result).toMatch(/<meta name="twitter:card" content="summary_large_image"\/>/);
		expect(result).toMatch(/<meta name="twitter:url" content="https:\/\/example.com\/"\/>/);
		expect(result).toMatch(/<meta name="twitter:title" content="Test Page \| Test Site"\/>/);
		expect(result).toMatch(
			/<meta name="twitter:description" content="This is a test page - A test site for StudioCMS"\/>/
		);
		expect(result).toMatch(
			/<meta property="og:image" content="https:\/\/example.com\/default-og-image.png"\/>/
		);
		expect(result).toMatch(
			/<meta name="twitter:image" content="https:\/\/example.com\/default-og-image.png"\/>/
		);
		expect(result).toMatch(/<\/head>/);
		expect(result).toMatch(/<body data-astro-source-file=".*" data-astro-source-loc="48:8">/);
		expect(result).toMatch(/<!-- If no dropdown items -->/);
		expect(result).toMatch(
			/<div class="navigation" data-astro-source-file=".*" data-astro-source-loc="29:29">/
		);
		expect(result).toMatch(
			/<div class="title" data-astro-source-file=".*" data-astro-source-loc="30:29">/
		);
		expect(result).toMatch(
			/<a href="\/" data-astro-source-file=".*" data-astro-source-loc="30:50">Test Site<\/a>/
		);
		expect(result).toMatch(
			/<div class="mini-nav" data-astro-source-file=".*" data-astro-source-loc="31:31">/
		);
		expect(result).toMatch(
			/<button data-astro-source-file=".*" data-astro-source-loc="32:21">Menu<\/button>/
		);
		expect(result).toMatch(
			/<div class="mini-nav-content" data-astro-source-file=".*" data-astro-source-loc="33:43">/
		);
		expect(result).toMatch(
			/<a href="\/" data-astro-source-file=".*" data-astro-source-loc="36:31">Home<\/a>/
		);
		expect(result).toMatch(
			/<a href="\/blog" data-astro-source-file=".*" data-astro-source-loc="36:31">Blog<\/a>/
		);
		expect(result).toMatch(/<\/div><\/div>/);
		expect(result).toMatch(
			/<a class="links" href="\/" data-astro-source-file=".*" data-astro-source-loc="43:41">Home<\/a>/
		);
		expect(result).toMatch(
			/<a class="links" href="\/blog" data-astro-source-file=".*" data-astro-source-loc="43:41">Blog<\/a>/
		);
		expect(result).toMatch(
			/<a class="avatar" href="\/dashboard\/login" data-astro-source-file=".*" data-astro-source-loc="47:35">Dashboard<\/a>/
		);
		expect(result).toMatch(/<\/div><!-- If dropdown items -->/);
		expect(result).toMatch(
			/<footer data-astro-cid-zwztlsnb data-astro-source-file=".*" data-astro-source-loc="10:9">/
		);
		expect(result).toMatch(
			/&copy; <span id="footer-year" data-astro-cid-zwztlsnb data-astro-source-file=".*" data-astro-source-loc="11:32">2025<\/span> Test Site. All rights reserved\./
		);
		expect(result).toMatch(/<\/footer> <script>/);
		expect(result).toMatch(/const footerYear = document.getElementById\('footer-year'\);/);
		expect(result).toMatch(/footerYear.textContent = new Date\(\).getFullYear\(\);/);
		expect(result).toMatch(/<\/script> {2}<\/body><\/html>/);
	});
});
