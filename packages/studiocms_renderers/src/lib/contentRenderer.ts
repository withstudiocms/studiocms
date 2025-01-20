import { logger } from '@it-astro:logger:studiocms-renderer';
import rendererConfig from 'studiocms:renderer/config';
import renderAstroMD from './astro-remark.js';
import renderMarkDoc from './markdoc.js';
import renderAstroMDX from './mdx.js';

const { renderer } = rendererConfig;

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
export async function contentRenderer(content: string): Promise<string> {
	if (typeof renderer === 'object') {
		if (!renderer.renderer || !renderer.name) {
			throw new Error('Invalid custom renderer');
		}
		logger.debug(`Using custom renderer: ${renderer.name}`);
		return await renderer.renderer(content);
	}

	switch (renderer) {
		case 'astro':
			logger.debug('Using built-in renderer: astro remark');
			return await renderAstroMD(content);
		case 'markdoc':
			logger.debug('Using built-in renderer: markdoc');
			return await renderMarkDoc(content);
		case 'mdx':
			logger.debug('Using built-in renderer: mdx');
			return await renderAstroMDX(content);
		default:
			logger.error(`Unknown renderer: ${renderer}, falling back to astro remark`);
			return await renderAstroMD(content);
	}
}

export default contentRenderer;
