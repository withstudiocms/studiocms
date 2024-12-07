import type { StudioCMSOptions } from '../schemas';

/**
 * A utility function to define the StudioCMS config object.
 * This function is used to define the optional StudioCMS
 * config object in the Astro project root. The expected file
 * name is `studiocms.config.mjs`. And it should be adjacent
 * to the Astro project's `astro.config.mjs` file.
 *
 * StudioCMS will attempt to import this file and use the default
 * export as the StudioCMS config object automatically if it exists.
 *
 * Using this function is optional, but it can be useful for IDEs
 * to provide better intellisense and type checking.
 *
 * @example
 * ```js
 * // studiocms.config.mjs
 * import { defineStudioCMSConfig } from 'studiocms';
 *
 * export default defineStudioCMSConfig({
 *  dbStartPage: true,
 *  contentRenderer: 'marked',
 *  verbose: true,
 *  dateLocale: 'en-us',
 *  // ...Other Options
 * })
 * ```
 *
 */
export function defineStudioCMSConfig(config: StudioCMSOptions) {
	return config;
}
