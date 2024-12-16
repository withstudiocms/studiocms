import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import type { MarkdocRenderer } from '@studiocms/core/schemas/renderer';

export function renderReactStatic(): MarkdocRenderer {
	return {
		name: 'react-static',
		renderer: async (content: RenderableTreeNode) => {
			return Markdoc.renderers.reactStatic(content);
		},
	};
}

export default renderReactStatic;
