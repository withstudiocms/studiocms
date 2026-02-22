/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed for dynamic functionality */
import type { SSRResult } from 'astro';
import type { HTMLString } from 'astro/runtime/server/escape.js';
import type { RenderTemplateResult } from 'astro/runtime/server/render/astro/render-template.js';
import type { ComponentSlotValue } from 'astro/runtime/server/render/slot.js';
import type { MarkdownHeading } from '../../types.ts';

/**
 * Represents the response from rendering a markdown document.
 */
export interface RenderResponse {
	/**
	 * The rendered HTML content as a string.
	 */
	html: HTMLString;

	/**
	 * The HTML content of the markdown document before rendering.
	 *
	 * use this with astro's `set:html` prop to render markdown content as HTML
	 */
	code: string;

	/**
	 * Metadata extracted from the markdown document.
	 */
	meta: {
		/**
		 * An array of headings found in the markdown document.
		 */
		headings: MarkdownHeading[];

		/**
		 * An array of local image paths found in the markdown document.
		 */
		localImagePaths: string[];
		/**
		 * An array of remote image paths found in the markdown document.
		 */
		remoteImagePaths: string[];

		/**
		 * The frontmatter data extracted from the markdown document.
		 *
		 * @remarks
		 * The frontmatter is represented as a record with string keys and values of any type.
		 */

		frontmatter: Record<string, any>;
	};
}

export interface RenderComponents {
	$$result: SSRResult;
	components?: Record<string, any>;
}

export interface MarkdownComponentAttributes {
	content: string;
	components?: Record<string, any>;
}

export interface Props extends MarkdownComponentAttributes {
	[name: string]: any;
}

export interface ComponentSlots {
	default: ComponentSlotValue | RenderTemplateResult;
}
