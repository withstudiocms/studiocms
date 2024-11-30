import { defineStudioCMSConfig, defineStudioCMSPlugin } from '@studiocms/core/lib';
import type {
	CustomRenderer,
	Renderer,
	StudioCMSOptions,
	StudioCMSPluginInput,
} from '@studiocms/core/schemas';
import type { StudioCMSPluginOptions } from '@studiocms/core/types';
import integration from './integration';

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see [GitHub Repo: 'withstudiocms/studiocms'](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
export const studioCMS = integration;

export default studioCMS;

// Config Utility
export { defineStudioCMSConfig, type StudioCMSOptions };

// Plugin System

export type { CustomRenderer, Renderer };

/**
 * Defines a plugin for StudioCMS.
 *
 * @param options - The configuration options for the plugin.
 * @returns The provided plugin options.
 */
export function definePlugin(options: StudioCMSPluginInput) {
	return options;
}

//// DEPRECATED: Use `definePlugin` instead
export { defineStudioCMSPlugin, type StudioCMSPluginOptions };
