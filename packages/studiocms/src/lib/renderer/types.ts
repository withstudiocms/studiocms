import type { AstroConfig } from 'astro';
import type { StudioCMSMarkdownOptions } from '../../schemas/config/pageTypeOptions.js';

/**
 * Interface representing shared configuration for markdown.
 *
 * @interface Shared
 * @property {AstroConfig['markdown']} markdownConfig - The markdown configuration from AstroConfig.
 */
export interface Shared {
	markdownConfig: AstroConfig['markdown'];
	studiocms: StudioCMSMarkdownOptions | undefined;
}
