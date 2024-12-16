import { logger } from '@it-astro:logger:studiocms-renderer';
import rendererConfig from 'studiocms:renderer/config';
import { HTMLString } from 'astro/runtime/server/index.js';
import builtInContentRenderer from '../lib/contentRenderer';

export const Renderer = Object.assign(
	function Renderer(result, attributes, slots) {
		return {
			get [Symbol.toStringTag]() {
				return 'AstroComponent';
			},
			async *[Symbol.asyncIterator]() {
				const content = attributes.content;
				yield new HTMLString(await builtInContentRenderer(content));
			},
		};
	},
	{
		isAstroComponentFactory: true,
	}
);

export default Renderer;
