/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import { describe, expect, it, vi } from 'vitest';
import { template } from '../../../src/integrations/dynamic-sitemap/sitemap-index.xml';

describe('template', () => {
	it('generates correct XML for multiple entries', () => {
		const entries = [
			{ location: 'https://example.com/sitemap1.xml' },
			{ location: 'https://example.com/sitemap2.xml' },
		];
		const result = template(entries);
		expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(result).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(result).toContain('<sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>');
		expect(result).toContain('<sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>');
		expect(result.trim().endsWith('</sitemapindex>')).toBe(true);
	});

	it('generates correct XML for a single entry', () => {
		const entries = [{ location: 'https://example.com/sitemap1.xml' }];
		const result = template(entries);
		expect(result).toContain('<sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>');
		expect(result.match(/<sitemap>/g)?.length).toBe(1);
	});

	it('generates correct XML for empty entries', () => {
		const entries: { location: string }[] = [];
		const result = template(entries);
		expect(result).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(result).not.toContain('<sitemap><loc>');
	});
});

describe('GET', () => {
	it('GET returns correct XML response with dynamic URLs', async () => {
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

	it('GET returns empty sitemapindex if no sitemaps', async () => {
		vi.mock('virtual:studiocms/sitemaps', () => ({
			sitemaps: [],
		}));

		const { GET: mockedGET } = await import(
			'../../../src/integrations/dynamic-sitemap/sitemap-index.xml'
		);
		const mockContext = { url: 'https://example.com/' } as any;
		const response = await mockedGET(mockContext);
		const text = await response.text();
		expect(text).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(text).not.toContain('<sitemap><loc>');
	});
});
