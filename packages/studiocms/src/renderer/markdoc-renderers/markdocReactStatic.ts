import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import type { MarkdocRenderer } from '../../schemas/config/rendererConfig.js';

export function renderReactStatic(): MarkdocRenderer {
	return {
		name: 'react-static',
		renderer: async (content: RenderableTreeNode) => {
			return Markdoc.renderers.reactStatic(content);
		},
	};
}

export default renderReactStatic;
