import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import type { MarkdocRenderer } from '../../schemas/config/rendererConfig.js';

export function renderHTML(): MarkdocRenderer {
	return {
		name: 'html',
		renderer: async (content: RenderableTreeNode) => {
			return Markdoc.renderers.html(content);
		},
	};
}

export default renderHTML;
