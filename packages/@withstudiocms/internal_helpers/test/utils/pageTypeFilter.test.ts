import { describe, expect, it } from 'vitest';
import {
	pageContentComponentFilter,
	rendererComponentFilter,
} from '../../src/utils/pageTypeFilter.js';

describe('rendererComponentFilter', () => {
	it('returns correct export statement for valid input', () => {
		const comp = './components/Renderer.astro';
		const safePageType = 'BlogPage';
		const result = rendererComponentFilter(comp, safePageType);
		expect(result).toBe(`export { default as BlogPage } from './components/Renderer.astro';`);
	});

	it('throws error if comp is undefined', () => {
		const safePageType = 'HomePage';
		expect(() => rendererComponentFilter(undefined, safePageType)).toThrowError(
			'Renderer Component path is required for page type: HomePage'
		);
	});

	it('returns export statement with empty string comp', () => {
		// This is technically allowed by the type, but should throw
		const safePageType = 'EmptyPage';
		expect(() => rendererComponentFilter('', safePageType)).toThrowError(
			'Renderer Component path is required for page type: EmptyPage'
		);
	});
});

describe('pageContentComponentFilter', () => {
	it('returns correct export statement for valid input', () => {
		const comp = './components/PageContent.astro';
		const safePageType = 'DocsPage';
		const result = pageContentComponentFilter(comp, safePageType);
		expect(result).toBe(`export { default as DocsPage } from './components/PageContent.astro';`);
	});

	it('throws error if comp is undefined', () => {
		const safePageType = 'LandingPage';
		expect(() => pageContentComponentFilter(undefined, safePageType)).toThrowError(
			'Page Content Component path is required for page type: LandingPage'
		);
	});

	it('returns export statement with empty string comp', () => {
		// This is technically allowed by the type, but should throw
		const safePageType = 'EmptyContentPage';
		expect(() => pageContentComponentFilter('', safePageType)).toThrowError(
			'Page Content Component path is required for page type: EmptyContentPage'
		);
	});
});
