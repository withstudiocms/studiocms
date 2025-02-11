import contentRenderer from 'studiocms:renderer/current';
import { HTMLString } from 'astro/runtime/server/index.js';

export default Object.assign(
	function Renderer(result, { content }) {
		return {
			get [Symbol.toStringTag]() {
				return 'AstroComponent';
			},
			async *[Symbol.asyncIterator]() {
				const renderedContent = await contentRenderer(content, result);
				yield new HTMLString(renderedContent);
			},
		};
	},
	{
		isAstroComponentFactory: true,
	}
);
