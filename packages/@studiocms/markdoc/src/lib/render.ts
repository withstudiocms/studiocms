import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { MarkDocRenderer } from '../types.js';
import { shared } from './shared.js';

const { argParse, transformConfig, type } = shared.markDocConfig;

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
	// Parse the Markdoc to AST
	const ast = Markdoc.parse(content, argParse);
	// Transform to MarkDoc
	const MarkDocContent = Markdoc.transform(ast, transformConfig);

	// Render to HTML
	switch (type) {
		case 'html': {
			const data = await renderHTML.render(MarkDocContent);
			return data;
		}
		case 'react-static': {
			const data = await renderReactStatic.render(MarkDocContent);
			return data;
		}
		default: {
			if (!type) {
				throw new Error('Error in MarkDoc config, renderer not found.');
			}
			try {
				const data = await type.render(MarkDocContent);
				return data;
			} catch {
				throw new Error(`Error in MarkDoc renderer, Unable to render with ${type.name}`);
			}
		}
	}
}

export default renderMarkDoc;
