import contentRenderer from 'studiocms:renderer/current';
import { HTMLString } from 'astro/runtime/server/index.js';

export const Renderer = Object.assign(
	function Renderer(result, attributes, slots) {
		return {
			get [Symbol.toStringTag]() {
				return 'AstroComponent';
			},
			async *[Symbol.asyncIterator]() {
				const content = attributes.content;
				yield new HTMLString(await contentRenderer(content));
			},
		};
	},
	{
		isAstroComponentFactory: true,
	}
);

export default Renderer;
