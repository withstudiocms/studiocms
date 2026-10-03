/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import type { AstroIntegrationLogger } from 'astro';
import { describe, expect, vi } from 'vitest';
import {
	generateContent,
	generateHostContent,
	generateSitemapContent,
	printInfo,
	throwMsg,
	validateHost,
	validateUrl,
} from '../../../src/integrations/robots/core';
import type { RobotsConfig } from '../../../src/integrations/robots/schema.js';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Robots Core Utils';

function createLogger() {
	return {
		info: vi.fn(),
		warn: vi.fn(),
	} as unknown as AstroIntegrationLogger;
}

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			host: 'example.com',
		},
		{
			host: 'sub.domain.co.uk',
		},
	].forEach(({ host }) => {
		test(`validateHost passes for valid host: ${host}`, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:validateHost'];

			await setupAllure({
				subSuiteName: 'validateHost valid host tests',
				tags: [...tags],
			});

			const logger = createLogger();
			expect(() => validateHost(host, logger)).not.toThrow();
		});
	});

	[
		{
			host: 123,
		},
		{
			host: 'invalid_host',
		},
	].forEach(({ host }) => {
		test(`validateHost throws for invalid host: ${host}`, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:validateHost'];

			await setupAllure({
				subSuiteName: 'validateHost invalid host tests',
				tags: [...tags],
			});

			const logger = createLogger();
			expect(() => validateHost(host as any, logger)).toThrow();
		});
	});

	[
		{
			config: { host: true },
		},
		{
			config: { host: false },
		},
		{
			config: { host: 'localhost' },
		},
		{
			config: { host: 'example.com' },
			toContain: 'Host: example.com',
		},
	].forEach(({ config, toContain }) => {
		test(`generateHostContent returns empty string for host: ${config.host}`, async ({
			setupAllure,
		}) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:generateHost'];

			await setupAllure({
				subSuiteName: 'generateHostContent tests',
				tags: [...tags],
			});

			const logger = createLogger();
			const result = generateHostContent(config as any, logger);
			if (toContain) {
				expect(result).toContain(toContain);
			} else {
				expect(result).toBe('');
			}
		});
	});

	test('generateHostContent throws for host as number', async ({ setupAllure }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:generateHost'];

		await setupAllure({
			subSuiteName: 'generateHostContent error handling test',
			tags: [...tags],
		});

		const logger = createLogger();
		expect(() => generateHostContent({ host: 123 } as any, logger)).toThrow();
	});

	['ftp://example.com/sitemap.xml', 'http://example.com/sitemap.doc'].forEach((sitemapUrl) => {
		test(`validateUrl throws for invalid sitemap url: ${sitemapUrl}`, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:validateUrl'];

			await setupAllure({
				subSuiteName: 'validateUrl invalid sitemap url tests',
				tags: [...tags],
			});

			const logger = createLogger();
			expect(() => validateUrl(sitemapUrl, logger)).toThrow();
		});
	});

	[
		'https://example.com/sitemap.xml',
		'http://example.com/sitemap.xml.gz',
		'http://example.com/sitemap.txt',
		'http://example.com/sitemap.json',
		'http://example.com/sitemap.xhtml',
	].forEach((sitemapUrl) => {
		test(`validateUrl passes for valid sitemap url: ${sitemapUrl}`, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:validateUrl'];

			await setupAllure({
				subSuiteName: 'validateUrl valid sitemap url tests',
				tags: [...tags],
			});

			const logger = createLogger();
			expect(() => validateUrl(sitemapUrl, logger)).not.toThrow();
		});
	});

	[
		{
			config: { sitemap: true },
			siteHref: 'https://site/',
			toContain: ['Sitemap: https://site/sitemap-index.xml'],
		},
		{
			config: { sitemap: 'https://site/sitemap.xml' },
			siteHref: '',
			toContain: ['Sitemap: https://site/sitemap.xml'],
		},
		{
			config: { sitemap: ['https://site/sitemap.xml', 'https://site/sitemap.txt'] },
			siteHref: '',
			toContain: ['Sitemap: https://site/sitemap.xml', 'Sitemap: https://site/sitemap.txt'],
		},
	].forEach(({ config, siteHref, toContain }) => {
		test(`generateSitemapContent returns correct sitemap lines for config.sitemap: ${JSON.stringify(
			config.sitemap
		)}`, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:generateSitemap'];

			await setupAllure({
				subSuiteName: 'generateSitemapContent tests',
				tags: [...tags],
			});

			const logger = createLogger();
			const result = generateSitemapContent(config as any, siteHref, logger);
			toContain.forEach((line) => {
				expect(result).toContain(line);
			});
		});
	});

	test('generateSitemapContent throws for config.sitemap as boolean false', async ({
		setupAllure,
	}) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:generateSitemap'];

		await setupAllure({
			subSuiteName: 'generateSitemapContent false sitemap test',
			tags: [...tags],
		});

		const logger = createLogger();
		expect(() => generateSitemapContent({ sitemap: false }, 'https://site/', logger)).not.toThrow();
	});

	test('throwMsg logs and throws correctly based on type', async ({ setupAllure, step }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:throwMsg'];

		await setupAllure({
			subSuiteName: 'throwMsg tests',
			tags: [...tags],
		});

		const logger = createLogger();

		await step('Testing type "error"', () => {
			expect(() => throwMsg('fail', 'error', logger)).toThrow('fail');
			expect(logger.info).toHaveBeenCalled();
		});

		await step('Testing type "warn"', () => {
			throwMsg('warn', 'warn', logger);
			expect(logger.warn).toHaveBeenCalled();
		});

		await step('Testing type true', () => {
			expect(() => throwMsg('fail', true, logger)).toThrow(/google\.com/);
			expect(logger.info).toHaveBeenCalled();
		});

		await step('Testing default type', () => {
			expect(() => throwMsg('fail', false, logger)).toThrow(/yandex\.com/);
			expect(logger.info).toHaveBeenCalled();
		});
	});

	[
		{
			config: {
				policy: [{ allow: ['/'], disallow: ['/private'] }],
				sitemap: false,
				host: false,
			},
		},
		{
			config: {
				policy: [{ userAgent: '*', allow: [], disallow: [] }],
				sitemap: false,
				host: false,
			},
		},
		{
			config: {
				policy: [
					{ userAgent: '*', allow: ['/'], disallow: ['/private'], crawlDelay: 'fast' as any },
				],
				sitemap: false,
				host: false,
			},
		},
		{
			config: {
				policy: [{ userAgent: '*', allow: ['/'], disallow: ['/private'], crawlDelay: -1 }],
				sitemap: false,
				host: false,
			},
		},
		{
			config: {
				policy: [{ userAgent: '*', allow: ['/'], disallow: ['/private'], crawlDelay: 100 }],
				sitemap: false,
				host: false,
			},
		},
	].forEach(({ config }) => {
		test(`generateContent throws for invalid config: ${JSON.stringify(config)}`, async ({
			setupAllure,
		}) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:generateContent'];

			await setupAllure({
				subSuiteName: 'generateContent invalid config tests',
				tags: [...tags],
			});

			const logger = createLogger();
			expect(() => generateContent(config as any, '', logger)).toThrow();
		});
	});

	test('generateContent generates valid robots.txt content', async ({ setupAllure }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:generateContent'];

		await setupAllure({
			subSuiteName: 'generateContent valid config test',
			tags: [...tags],
		});

		const logger = createLogger();
		const config: RobotsConfig = {
			policy: [
				{
					userAgent: '*',
					allow: ['/'],
					disallow: ['/private'],
					crawlDelay: 1,
					cleanParam: 'ref',
				},
			],
			sitemap: 'https://site/sitemap.xml',
			host: 'example.com',
		};
		const result = generateContent(config, 'https://site/', logger);
		expect(result).toContain('User-agent: *');
		expect(result).toContain('Allow: /');
		expect(result).toContain('Disallow: /private');
		expect(result).toContain('Crawl-delay: 1');
		expect(result).toContain('Clean-param: ref');
		expect(result).toContain('Sitemap: https://site/sitemap.xml');
		expect(result).toContain('Host: example.com');
	});

	[
		{
			fileSize: 11,
			executionTime: 100,
			destDir: '/tmp/robots.txt',
		},
		{
			fileSize: 5,
			executionTime: 50,
			destDir: '/tmp/robots.txt',
		},
	].forEach(({ fileSize, executionTime, destDir }) => {
		test(`printInfo logs correctly for fileSize: ${fileSize}, executionTime: ${executionTime}`, async ({
			setupAllure,
		}) => {
			const tags = [...sharedTags, 'integration:robots', 'robots:core', 'robots:printInfo'];

			await setupAllure({
				subSuiteName: 'printInfo tests',
				tags: [...tags],
			});

			const logger = createLogger();

			printInfo(fileSize, executionTime, logger, destDir);

			expect(logger.info).toHaveBeenCalled();
		});
	});
});
