import astroMarkdownConfig from 'studiocms:renderer/astroMarkdownConfig';
import { type AstroMarkdownOptions, createMarkdownProcessor } from '@astrojs/markdown-remark';

/**
 * Render Astro Markdown
 *
 * Renders Astro Markdown content
 *
 * Astro is the built-in Astro remark-markdown plugin.
 * @see https://www.npmjs.com/package/@astrojs/markdown-remark
 *
 * @param content - The content to render
 * @returns The rendered content
 */
export async function renderAstroMD(content: string) {
	const mergedConfig: AstroMarkdownOptions = {
		...(astroMarkdownConfig as AstroMarkdownOptions),
		syntaxHighlight: false,
	};

	const processor = await createMarkdownProcessor(mergedConfig);

	return (await processor.render(content)).code;
}

export default renderAstroMD;
