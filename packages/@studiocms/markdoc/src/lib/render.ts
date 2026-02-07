import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { MarkDocRenderer } from '../types.js';
import { shared } from './shared.js';

const renderHTML: MarkDocRenderer = {
	name: 'html',
	render: async (content: RenderableTreeNode) => {
		return Markdoc.renderers.html(content);
	},
};

const renderReactStatic: MarkDocRenderer = {
	name: 'react-static',
	render: async (content: RenderableTreeNode) => {
		return Markdoc.renderers.reactStatic(content);
	},
};

export async function renderMarkDoc(content: string): Promise<string> {
	const { argParse, transformConfig, type } = shared.markDocConfig;

	// Parse the Markdoc to AST
	const ast = Markdoc.parse(content, argParse);
	// Transform to MarkDoc
	const MarkDocContent = Markdoc.transform(ast, transformConfig);

	// Render to HTML
	switch (type) {
		case 'react-static': {
			const data = await renderReactStatic.render(MarkDocContent);
			return data;
		}
		default: {
			const data = await renderHTML.render(MarkDocContent);
			return data;
		}
	}
}

export default renderMarkDoc;
