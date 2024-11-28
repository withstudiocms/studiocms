import { defineStudioCMSConfig, defineStudioCMSPlugin } from '@studiocms/core/lib';
import type { CustomRenderer, Renderer, StudioCMSOptions } from '@studiocms/core/schemas';
import type { StudioCMSPluginOptions } from '@studiocms/core/types';
import integration from './integration';

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * > **Note: Astro SSR adapters that are configured for Image Optimization will automatically take full control of the Image Optimization Service. Making the `imageService` option in this integration not have any effect.**
 *
 * @see [GitHub Repo: 'astrolicious/studiocms'](https://github.com/astrolicious/studiocms) for more information on how to contribute to StudioCMS.
 * @see [StudioCMS Docs](https://docs.studiocms.xyz) for more information on how to use StudioCMS.
 *
 */
export const studioCMS = integration;

export default studioCMS;

// Config Utility
export { defineStudioCMSConfig, type StudioCMSOptions };

// Plugin System
export { defineStudioCMSPlugin, type StudioCMSPluginOptions };

export type { CustomRenderer, Renderer };
