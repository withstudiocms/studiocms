import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegration } from 'astro';
import { generateContent, printInfo } from './core.js';
import { type RobotsConfig, RobotsTXTConfigSchema } from './schema.js';
import { getFileSizeInKilobytes, measureExecutionTime } from './utils.js';

/**
 * **Robots.txt Integration**
 *
 * A simple integration to generate a `robots.txt` file for your Astro project.
 *
 * @param astroConfig Robots Configuration
 * @returns AstroIntegration
 */
export default function createRobotsIntegration(options: RobotsConfig): AstroIntegration {
	let astroConfig: AstroConfig;
	let finalSiteMapHref: string;
	let executionTime: number;

	const config = RobotsTXTConfigSchema.parse(options);

	return {
		name: 'studiocms/robotstxt',
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
