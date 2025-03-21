import { createResolver } from 'astro-integration-kit';
import { type StudioCMSPlugin, definePlugin } from 'studiocms/plugins';
import { type MarkDocConfig, markdocConfigSchema } from './schema.js';
import { shared } from './shared.js';

export function plugin(options?: MarkDocConfig): StudioCMSPlugin {
	const opts = markdocConfigSchema.parse(options);

	const { resolve } = createResolver(import.meta.url);

	return definePlugin({
		identifier: '@studiocms/markdoc',
		name: 'StudioCMS MarkDoc',
		studiocmsMinimumVersion: '0.1.0-beta.12',
		pageTypes: [
			{
				identifier: 'studiocms/markdoc',
				label: 'MarkDoc',
				rendererComponent: resolve('./renderer.astro'),
			},
		],
		integration: {
			name: '@studiocms/markdoc',
			hooks: {
				'astro:config:done': () => {
					shared.markdoc = opts;
				},
			},
		},
	});
}

export default plugin;
