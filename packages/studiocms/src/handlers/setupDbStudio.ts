import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import { addVirtualImports, defineUtility } from 'astro-integration-kit';
import type { StudioCMSConfig } from 'src/schemas';

const { resolve } = createPathResolver(import.meta.url);

export const setupDbStudio = defineUtility('astro:config:setup')(
	async (params, opts: StudioCMSConfig['db']) => {
		const { addDevToolbarApp } = params;
		const { dialect } = opts;

		addVirtualImports(params, {
			name: 'studiocms:db-studio',
			imports: {
				'virtual:studiocms/db-studio/connection': `export { createConnectionFromConfig } from '${resolve(`../toolbar/db-viewer/studio/virtual-connection/${dialect}.js`)}';`,
			},
		});

		// Register the DB Studio dev toolbar app
		addDevToolbarApp({
			id: 'studiocms-db-viewer',
			entrypoint: resolve('../toolbar/db-viewer/index.js'),
			name: 'Database Viewer',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>',
		});
	}
);
