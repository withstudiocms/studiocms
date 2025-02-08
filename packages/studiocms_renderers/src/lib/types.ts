import type { StudioCMSConfigOptions } from '@studiocms/markdown-remark-processor';
import type { AstroConfig } from 'astro';

/**
 * Interface representing shared configuration for markdown.
 *
 * @interface Shared
 * @property {AstroConfig['markdown']} markdownConfig - The markdown configuration from AstroConfig.
 */
export interface Shared {
	markdownConfig: AstroConfig['markdown'];
	studiocms: StudioCMSConfigOptions;
}
