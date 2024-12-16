import { logger } from '@it-astro:logger:studiocms-renderer';
import rendererConfig from 'studiocms:renderer/config';
import { HTMLString, renderSlot } from 'astro/runtime/server/index.js';
import builtInContentRenderer from '../lib/contentRenderer';

async function renderToHTML(content) {
	const result = await builtInContentRenderer(content);

	return new HTMLString(result);
}

export const Renderer = Object.assign(
	function Renderer(result, attributes, slots) {
		return {
			get [Symbol.toStringTag]() {
				return 'AstroComponent';
			},
			async *[Symbol.asyncIterator]() {
				const content = attributes.content;
				yield await renderToHTML(content);
			},
		};
	},
	{
		isAstroComponentFactory: true,
	}
);

export default Renderer;
