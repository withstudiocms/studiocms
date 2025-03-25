import type { AstroConfig } from 'astro';
import type {
	HTMLSchemaOptions,
	StudioCMSMarkdownOptions,
} from '../../schemas/config/pageTypeOptions.js';

/**
 * Interface representing shared configuration for markdown.
 *
 * @interface Shared
 */
export interface Shared {
	astroMDRemark: AstroConfig['markdown'] | undefined;
	studiocmsMarkdown: StudioCMSMarkdownOptions | undefined;
	studiocmsHTML: HTMLSchemaOptions | undefined;
}
