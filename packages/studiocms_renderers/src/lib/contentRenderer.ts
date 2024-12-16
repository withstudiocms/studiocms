import { logger } from '@it-astro:logger:studiocms-renderer';
import rendererConfig from 'studiocms:renderer/config';
import renderAstroMD from './astro-remark';
import renderMarkDoc from './markdoc';
import renderAstroMDX from './mdx';

const { renderer } = rendererConfig;

/**
 * Content Renderer
 *
 * Renders content based on the renderer configuration
 *
 * @param content - The content to render
 * @param renderer - The renderer function to use
 * @returns The rendered content
 *
 * @example
 * function sampleRenderer(content: string): Promise<string> {
 *   // Assuming the renderer function processes the content and returns a string
 *   return `<p>${content}</p>`;
 * }
 *
 * const renderedContent = contentRenderer({
 *   content: 'Hello, world!',
 *   renderer: sampleRenderer,
 * });
 */
export async function contentRenderer(content: string): Promise<string> {
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
			if (renderer.renderer) {
				logger.debug(`Using custom renderer: ${renderer.name}`);
				return await renderer.renderer(content);
			}
			logger.debug('Using built-in renderer: astro remark');
			return await renderAstroMD(content);
	}
}

export default contentRenderer;
