import rendererConfig from 'studiocms:renderer/config';
import type { SSRResult } from 'astro';
import renderAstroMD from './astro-remark.js';
import renderStudioCMS from './studiocms.js';

const { flavor } = rendererConfig;

/**
 * Renders the given content using a specified renderer.
 *
 * The renderer can be a custom object with a `renderer` function and a `name` property,
 * or a string indicating one of the built-in renderers ('astro', 'markdoc', 'mdx').
 *
 * @param content - The content to be rendered.
 * @returns A promise that resolves to the rendered content as a string.
 * @throws Will throw an error if the custom renderer object is invalid.
 */
export async function contentRenderer(content: string, SSRResult: SSRResult): Promise<string> {
	switch (flavor) {
		case 'astro':
			return await renderAstroMD(content);
		default:
			return await renderStudioCMS(content, SSRResult);
	}
}

export default contentRenderer;
