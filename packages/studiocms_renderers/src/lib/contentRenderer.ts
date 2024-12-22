import { logger } from '@it-astro:logger:studiocms-renderer';
import rendererConfig from 'studiocms:renderer/config';
import renderAstroMD from './astro-remark';
import renderMarkDoc from './markdoc';
import renderAstroMDX from './mdx';

const { renderer } = rendererConfig;

/**
 * Content Renderer
 *
 * Renders content using the specified renderer from the StudioCMS configuration
 *
 * @param content - The content to render
 * @returns The rendered content as a HTML string
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
