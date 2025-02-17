import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { convertToSafeString } from '../../utils/safeString.js';

interface DynamicSitemapOptions {
	sitemaps: {
		pluginName: string;
		sitemapXMLEndpointPath: string | URL;
	}[];
}

function safeString(str: string) {
	return convertToSafeString(str).replace(/^_+/, '').replace(/_+$/, '').replace('studiocms_', '');
}

export function dynamicSitemap(options: DynamicSitemapOptions): AstroIntegration {
	const { resolve } = createResolver(import.meta.url);

	return {
		name: 'studiocms/dynamic-sitemap',
		hooks: {
			'astro:config:setup': (params) => {
				const { injectRoute } = params;

				const { sitemaps } = options;

				addVirtualImports(params, {
					name: 'studiocms/dynamic-sitemap',
					imports: {
						'virtual:studiocms/sitemaps': `
                            export const sitemaps = ${JSON.stringify([...sitemaps.map(({ pluginName }) => `./sitemap-${safeString(pluginName)}.xml`)])};
                        `,
					},
				});

				injectRoute({
					entrypoint: resolve('./sitemap-index.xml.js'),
					pattern: '/sitemap-index.xml',
					prerender: false,
				});

				const existingSitemaps: string[] = [];

				for (const { pluginName, sitemapXMLEndpointPath: entrypoint } of sitemaps) {
					let pattern = `/sitemap-${safeString(pluginName)}.xml`;

					if (existingSitemaps.includes(pattern)) {
						pattern = `/sitemap-${safeString(pluginName)}-${existingSitemaps.length}.xml`;
					}

					injectRoute({
						entrypoint,
						pattern,
						prerender: false,
					});
				}
			},
		},
	};
}
