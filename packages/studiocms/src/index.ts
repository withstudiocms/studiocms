import {
	type CustomRenderer,
	type Renderer,
	type SafePluginListType,
	type StudioCMSConfig,
	type StudioCMSOptions,
	type StudioCMSPlugin,
	type StudioCMSPluginOptions,
	definePlugin,
} from '@studiocms/core/schemas';
import { defineStudioCMSConfig } from '@studiocms/core/utils';
import type { AstroIntegration } from 'astro';
import { name as pkgName, version as pkgVersion } from '../package.json';
import buildDone from './hooks/build-done';
import configDone from './hooks/config-done';
import configSetup from './hooks/config-setup';
import dbSetup from './hooks/db-setup';
import serverStart from './hooks/server-start';
import type { Messages } from './types';

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see The [GitHub Repo: `withstudiocms/studiocms`](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
export function studioCMSIntegration(opts?: StudioCMSOptions): AstroIntegration {
	// Resolved Options for StudioCMS
	let options: StudioCMSConfig;
	// Messages Array for Logging
	const messages: Messages = [];

	return {
		name: pkgName,
		hooks: {
			// DB Setup: Setup the Database Connection for AstroDB and StudioCMS
			'astro:db:setup': (params) => dbSetup(params),
			// Config Setup: Main Setup for StudioCMS
			'astro:config:setup': async (params) => {
				options = await configSetup(params, { pkgName, pkgVersion, opts, messages });
			},
			// Config Done: Make DTS file for StudioCMS Plugins Virtual Module
			'astro:config:done': (params) => configDone(params, messages),
			// DEV SERVER: Check for updates on server start and log messages
			'astro:server:start': async (params) =>
				await serverStart(params, { pkgName, pkgVersion, verbose: options.verbose, messages }),
			// BUILD: Log messages at the end of the build
			'astro:build:done': (params) => buildDone(params, options.verbose, messages),
		},
	};
}

export default studioCMSIntegration;

export {
	defineStudioCMSConfig,
	definePlugin,
	type StudioCMSPlugin,
	type CustomRenderer,
	type Renderer,
	type StudioCMSOptions,
	type StudioCMSPluginOptions,
	type SafePluginListType,
};
