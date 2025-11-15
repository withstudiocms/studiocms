/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import * as allure from 'allure-js-commons';
import { describe, expect, test, vi } from 'vitest';
import { template } from '../../../src/integrations/dynamic-sitemap/sitemap-index.xml';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Dynamic Sitemap - sitemap-index.xml';

describe(parentSuiteName, () => {
	test('sitemap-index.xml template generates valid XML', async () => {
		const tags = [...sharedTags, 'integration:dynamicSitemap', 'dynamicSitemap:sitemapIndex'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('template tests');
		await allure.tags(...tags);

		const entries = [
			{ location: 'https://example.com/sitemap1.xml' },
			{ location: 'https://example.com/sitemap2.xml' },
		];

		await allure.parameter('entries', JSON.stringify(entries));

		const result = template(entries);

		await allure.step('Validate XML structure', () => {
			expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(result).toContain(
				'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
			);
			expect(result).toContain('<sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>');
			expect(result).toContain('<sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>');
			expect(result.trim().endsWith('</sitemapindex>')).toBe(true);
		});
	});

	test('sitemap-index.xml template generates correct XML for a single entry', async () => {
		const tags = [...sharedTags, 'integration:dynamicSitemap', 'dynamicSitemap:sitemapIndex'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('template tests');
		await allure.tags(...tags);

		const entries = [{ location: 'https://example.com/sitemap1.xml' }];

		await allure.parameter('entries', JSON.stringify(entries));

		const result = template(entries);

		await allure.step('Validate XML structure for single entry', () => {
			expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(result).toContain(
				'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
			);
			expect(result).toContain('<sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>');
			expect(result.match(/<sitemap>/g)?.length).toBe(1);
			expect(result.trim().endsWith('</sitemapindex>')).toBe(true);
		});
	});

	test('sitemap-index.xml template generates correct XML for empty entries', async () => {
		const tags = [...sharedTags, 'integration:dynamicSitemap', 'dynamicSitemap:sitemapIndex'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('template tests');
		await allure.tags(...tags);

		const entries: { location: string }[] = [];

		await allure.parameter('entries', JSON.stringify(entries));

		const result = template(entries);

		await allure.step('Validate XML structure for empty entries', () => {
			expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(result).toContain(
				'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
			);
			expect(result).not.toContain('<sitemap><loc>');
			expect(result.trim().endsWith('</sitemapindex>')).toBe(true);
		});
	});

	test('sitemap-index.xml GET returns correct XML response with dynamic URLs', async () => {
		const tags = [...sharedTags, 'integration:dynamicSitemap', 'dynamicSitemap:sitemapIndex'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('GET tests');
		await allure.tags(...tags);

		// Mock sitemaps import
		const mockSitemaps = ['/sitemap1.xml', '/sitemap2.xml'];
		vi.mock('virtual:studiocms/sitemaps', () => ({
			sitemaps: mockSitemaps,
		}));

		// Re-import GET after mocking
		const { GET: mockedGET } = await import(
			'../../../src/integrations/dynamic-sitemap/sitemap-index.xml'
		);

		const mockContext = {
			url: 'https://example.com/base/',
		} as any;

		const response = await mockedGET(mockContext);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/xml');
		const text = await response.text();
		expect(text).toContain(`<?xml version="1.0" encoding="UTF-8"?>`);
		expect(text).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	test('sitemap-index.xml GET returns empty sitemapindex if no sitemaps', async () => {
		const tags = [...sharedTags, 'integration:dynamicSitemap', 'dynamicSitemap:sitemapIndex'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('GET tests');
		await allure.tags(...tags);

		// Mock sitemaps import
		vi.mock('virtual:studiocms/sitemaps', () => ({
			sitemaps: [],
		}));

		const { GET: mockedGET } = await import(
			'../../../src/integrations/dynamic-sitemap/sitemap-index.xml'
		);

		const mockContext = {
			url: 'https://example.com/base/',
		} as any;

		const response = await mockedGET(mockContext);
		const text = await response.text();
		expect(text).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(text).not.toContain('<sitemap><loc>');
	});
});
