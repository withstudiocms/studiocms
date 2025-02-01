import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegration } from 'astro';
import { generateContent, printInfo } from './core.js';
import type { RobotsConfig } from './types.js';
import { getFileSizeInKilobytes, measureExecutionTime, readJson } from './utils.js';

const { name } = readJson<{ name: string }>(new URL('../package.json', import.meta.url));

const defaultConfig: RobotsConfig = {
	sitemap: true,
	host: false,
	policy: [
		{
			userAgent: ['*'],
			allow: ['/'],
			disallow: ['/dashboard/'],
		},
	],
};

/**
 * **Robots.txt Integration**
 *
 * A simple integration to generate a `robots.txt` file for your Astro project.
 *
 * @param astroConfig Robots Configuration
 * @returns AstroIntegration
 */
export default function createRobotsIntegration(options?: RobotsConfig): AstroIntegration {
	let astroConfig: AstroConfig;
	let finalSiteMapHref: string;
	let executionTime: number;

	const config = { ...defaultConfig, ...options };

	return {
		name,
		hooks: {
			'astro:config:setup': ({ config: cfg }) => {
				astroConfig = cfg;
			},
			'astro:build:start': () => {
				finalSiteMapHref = new URL(astroConfig.base, astroConfig.site).href;
			},
			'astro:build:done': async ({ dir, logger }) => {
				executionTime = measureExecutionTime(() => {
					fs.writeFileSync(
						new URL('robots.txt', dir),
						generateContent(config, finalSiteMapHref, logger),
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
