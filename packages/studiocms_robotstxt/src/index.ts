import type { AstroConfig, AstroIntegration } from 'astro';
import { name } from '../package.json';
import type { UsertAgentType } from './consts';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { generateContent, printInfo } from './core';
import { measureExecutionTime } from './utils';

function getFileSizeInKilobytes(filename: URL): number {
	const stats = fs.statSync(filename);
	const fileSizeInBytes = stats.size;
	const fileSizeInKilobytes = fileSizeInBytes / 1024;
	return fileSizeInKilobytes;
}

export interface RobotsConfig {
	/**
	 * @default false
	 * @description
	 * [ Optional ] Some crawlers(Yandex) support and only accept domain names.
	 * @example
	 * ```ts
	 * integrations:[
	 *  robots({
	 *    host: siteUrl.replace(/^https?:\/\/|:\d+/g, "")
	 *  })
	 * ]
	 * ```
	 */
	host?: boolean | string;
	/**
	 * @description
	 * [ Optional, zero or more per file ] The location of a sitemap for this website.
	 * @example
	 * ```ts
	 * sitemap: [
	 *  "https://example.com/sitemap.xml",
	 *  "https://www.example.com/sitemap.xml"
	 * ]
	 * ```
	 * The value of the [SITEMAP](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#sitemap) field is case-sensitive.
	 */
	sitemap?: boolean | string | string[];
	/**
	 * @description
	 * [ Optional ] List of `policy` rules.
	 * @default
	 * ```ts
	 * policy:[
	 *  {
	 *    userAgent: "*",
	 *    allow: "/"
	 *  }
	 * ]
	 * ```
	 * For more help, refer to [SYNTAX](https://yandex.com/support/webmaster/controlling-robot/robots-txt.html#recommend) by Yandex.
	 */
	policy?: PolicyOptions[] | undefined;
}
export interface PolicyOptions {
	/**
	 * @description
	 * [ Required ] Indicates the robot to which the rules listed in `robots.txt` apply.
	 * @example
	 * ```ts
	 * policy:[
	 *  {
	 *    userAgent: [
	 *      'Googlebot',
	 *      'Applebot',
	 *      'Baiduspider',
	 *      'bingbot'
	 *    ],
	 *    // crawling rule(s) for above bots
	 *  }
	 * ]
	 * ```
	 * Verified bots, refer to [DITIG](https://www.ditig.com/robots-txt-template#regular-template) or [Cloudflare Radar](https://radar.cloudflare.com/traffic/verified-bots).
	 */
	userAgent?: UsertAgentType | UsertAgentType[];
	/**
	 * @description
	 * [ At least one or more `allow` or `disallow` entries per rule ] Allows indexing site sections or individual pages.
	 * @example
	 * ```ts
	 * policy:[{allow:["/"]}]
	 * ```
	 * Path-based URL matching, refer to [SYNTAX](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values) via Google.
	 */
	allow?: string | string[];
	/**
	 * @description
	 * [ At least one or more `disallow` or `allow` entries per rule ] Prohibits indexing site sections or individual pages.
	 * @example
	 * ```ts
	 * policy:[
	 *  {
	 *    disallow:[
	 *      "/admin",
	 *      "/uploads/1989-08-21/*.jpg$"
	 *    ]
	 *  }
	 * ]
	 * ```
	 * Path-based URL matching, refer to [SYNTAX](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values) via Google.
	 */
	disallow?: string | string[];
	/**
	 * @description
	 * [ Optional ] Specifies the minimum interval (in seconds) for the search robot to wait after loading one page, before starting to load another.
	 *
	 * @example
	 * ```ts
	 * policy:[{crawlDelay:5}]
	 * ```
	 * About the [Crawl-delay](https://yandex.com/support/webmaster/robot-workings/crawl-delay.html#crawl-delay) directive.
	 */
	crawlDelay?: number;
	/**
	 * @description
	 * [ Optional ] Indicates to the robot that the page URL contains parameters (like UTM tags) that should be ignored when indexing it.
	 *
	 * @example
	 * ```bash
	 * # for URLs like:
	 * www.example2.com/index.php?page=1&sid=2564126ebdec301c607e5df
	 * www.example2.com/index.php?page=1&sid=974017dcd170d6c4a5d76ae
	 * ```
	 * ```ts
	 * policy:[
	 *  {
	 *    cleanParam: [
	 *      "sid /index.php",
	 *    ]
	 *  }
	 * ]
	 * ```
	 * For additional examples, please consult
	 * Yandex's [SYNTAX](https://yandex.com/support/webmaster/robot-workings/clean-param.html#clean-param__additional) guide.
	 */
	cleanParam?: string | string[];
}

const defaultConfig: RobotsConfig = {
	sitemap: true,
	host: false,
	policy: [
		{
			userAgent: '*',
			allow: '/',
		},
	],
};

export default function createRobotsIntegration(astroConfig: RobotsConfig): AstroIntegration {
	let config: AstroConfig;
	let finalSiteMapHref: string;
	let executionTime: number;

	const mergedConfig = { ...defaultConfig, ...astroConfig };

	return {
		name,
		hooks: {
			'astro:config:setup': ({ config: cfg }) => {
				config = cfg;
			},
			'astro:build:start': () => {
				finalSiteMapHref = new URL(config.base, config.site).href;
			},
			'astro:build:done': async ({ dir, logger }) => {
				executionTime = measureExecutionTime(() => {
					fs.writeFileSync(
						new URL('robots.txt', dir),
						generateContent(mergedConfig, finalSiteMapHref, logger),
						'utf-8'
					);
				});
				const fileSize = getFileSizeInKilobytes(new URL('robots.txt', dir));
				const destDir = fileURLToPath(dir);
				printInfo(fileSize, executionTime, logger, destDir);
			},
		},
	};
}
