/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import type { AstroIntegrationLogger } from 'astro';
import { describe, expect, it, vi } from 'vitest';
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

function createLogger() {
	return {
		info: vi.fn(),
		warn: vi.fn(),
	} as unknown as AstroIntegrationLogger;
}

describe('validateHost', () => {
	it('throws if host is not a string', () => {
		const logger = createLogger();
		expect(() => validateHost(123 as any, logger)).toThrow('Host must be a string');
	});

	it('throws if host is invalid', () => {
		const logger = createLogger();
		expect(() => validateHost('invalid_host', logger)).toThrow('Host is invalid');
	});

	it('does not throw for valid host', () => {
		const logger = createLogger();
		expect(() => validateHost('example.com', logger)).not.toThrow();
		expect(() => validateHost('sub.domain.co.uk', logger)).not.toThrow();
	});
});

describe('generateHostContent', () => {
	it('returns empty string for host true/false', () => {
		const logger = createLogger();
		expect(generateHostContent({ host: true } as any, logger)).toBe('');
		expect(generateHostContent({ host: false } as any, logger)).toBe('');
	});

	it('throws for host as number', () => {
		const logger = createLogger();
		expect(() => generateHostContent({ host: 123 } as any, logger)).toThrow();
	});

	it('returns Host line for valid host string', () => {
		const logger = createLogger();
		expect(generateHostContent({ host: 'example.com' } as any, logger)).toContain(
			'Host: example.com'
		);
	});

	it('does not return Host line for localhost', () => {
		const logger = createLogger();
		expect(generateHostContent({ host: 'localhost' } as any, logger)).toBe('');
	});
});

describe('validateUrl', () => {
	it('throws for invalid sitemap url', () => {
		const logger = createLogger();
		expect(() => validateUrl('ftp://example.com/sitemap.xml', logger)).toThrow();
		expect(() => validateUrl('http://example.com/sitemap.doc', logger)).toThrow();
	});

	it('does not throw for valid sitemap url', () => {
		const logger = createLogger();
		expect(() => validateUrl('https://example.com/sitemap.xml', logger)).not.toThrow();
		expect(() => validateUrl('http://example.com/sitemap.xml.gz', logger)).not.toThrow();
		expect(() => validateUrl('http://example.com/sitemap.txt', logger)).not.toThrow();
		expect(() => validateUrl('http://example.com/sitemap.json', logger)).not.toThrow();
		expect(() => validateUrl('http://example.com/sitemap.xhtml', logger)).not.toThrow();
	});
});

describe('generateSitemapContent', () => {
	const logger = createLogger();
	it('returns default sitemap for config.sitemap === true', () => {
		expect(generateSitemapContent({ sitemap: true } as any, 'https://site/', logger)).toContain(
			'Sitemap: https://site/sitemap-index.xml'
		);
	});

	it('throws for config.sitemap as number', () => {
		expect(() =>
			generateSitemapContent({ sitemap: 123 } as any, 'https://site/', logger)
		).toThrow();
	});

	it('returns sitemap line for valid string', () => {
		expect(
			generateSitemapContent({ sitemap: 'https://site/sitemap.xml' } as any, '', logger)
		).toContain('Sitemap: https://site/sitemap.xml');
	});

	it('returns multiple sitemap lines for array', () => {
		const result = generateSitemapContent(
			{ sitemap: ['https://site/sitemap.xml', 'https://site/sitemap.txt'] } as any,
			'',
			logger
		);
		expect(result).toContain('Sitemap: https://site/sitemap.xml');
		expect(result).toContain('Sitemap: https://site/sitemap.txt');
	});
});

describe('throwMsg', () => {
	it('logs and throws error for type "error"', () => {
		const logger = createLogger();
		expect(() => throwMsg('fail', 'error', logger)).toThrow('fail');
		expect(logger.info).toHaveBeenCalled();
	});

	it('logs warning for type "warn"', () => {
		const logger = createLogger();
		throwMsg('warn', 'warn', logger);
		expect(logger.warn).toHaveBeenCalled();
	});

	it('logs and throws error for type true', () => {
		const logger = createLogger();
		expect(() => throwMsg('fail', true, logger)).toThrow(/google\.com/);
		expect(logger.info).toHaveBeenCalled();
	});

	it('logs and throws error for default', () => {
		const logger = createLogger();
		expect(() => throwMsg('fail', false, logger)).toThrow(/yandex\.com/);
		expect(logger.info).toHaveBeenCalled();
	});
});

describe('generateContent', () => {
	const logger = createLogger();
	it('throws if userAgent missing', () => {
		const config: RobotsConfig = {
			policy: [{ allow: ['/'], disallow: ['/private'] }],
			sitemap: false,
			host: false,
		};
		expect(() => generateContent(config, '', logger)).toThrow(/userAgent/);
	});

	it('throws if allow/disallow missing', () => {
		const config: RobotsConfig = {
			policy: [{ userAgent: '*', allow: [], disallow: [] }],
			sitemap: false,
			host: false,
		};
		expect(() => generateContent(config, '', logger)).toThrow(/disallow/);
	});

	it('throws if crawlDelay is not a number', () => {
		const config: RobotsConfig = {
			policy: [{ userAgent: '*', allow: ['/'], disallow: ['/private'], crawlDelay: 'fast' as any }],
			sitemap: false,
			host: false,
		};
		expect(() => generateContent(config, '', logger)).toThrow(/crawlDelay/);
	});

	it('throws if crawlDelay is negative', () => {
		const config: RobotsConfig = {
			policy: [{ userAgent: '*', allow: ['/'], disallow: ['/private'], crawlDelay: -1 }],
			sitemap: false,
			host: false,
		};
		expect(() => generateContent(config, '', logger)).toThrow(/positive/);
	});

	it('throws if crawlDelay is out of range', () => {
		const config: RobotsConfig = {
			policy: [{ userAgent: '*', allow: ['/'], disallow: ['/private'], crawlDelay: 100 }],
			sitemap: false,
			host: false,
		};
		expect(() => generateContent(config, '', logger)).toThrow(/between 0.1 and 60/);
	});

	it('generates valid robots.txt content', () => {
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
});

describe('printInfo', () => {
	it('logs warning if fileSize > 10', () => {
		const logger = createLogger();
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		printInfo(11, 100, logger, '/tmp/robots.txt');
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('logs info for file creation', () => {
		const logger = createLogger();
		printInfo(5, 50, logger, '/tmp/robots.txt');
		expect(logger.info).toHaveBeenCalled();
	});
});
