import type { StudioCMSMarkdownRemarkIntegrationOptions } from '../types.ts';

/**
 * The default configuration options for the StudioCMS Markdown Remark integration. This includes default values for injecting CSS, defining custom components, and extended markdown options specific to StudioCMS. These defaults will be used if the user does not specify their own configuration in their Astro configuration file.
 */
export const defaultIntegrationOptions: StudioCMSMarkdownRemarkIntegrationOptions = {
	injectCSS: true,
};
