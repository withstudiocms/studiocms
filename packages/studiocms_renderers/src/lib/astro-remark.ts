import astroMarkdownConfig from 'studiocms:renderer/astroMarkdownConfig';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

const cachedProcessor = await createMarkdownProcessor(astroMarkdownConfig);

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
	return (await cachedProcessor.render(content)).code;
}

export default renderAstroMD;
