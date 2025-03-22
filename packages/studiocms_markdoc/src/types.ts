import type { ConfigType, ParserArgs, RenderableTreeNode } from '@markdoc/markdoc';

export interface MarkDocRenderer {
	name: string;
	render: (content: RenderableTreeNode) => Promise<string>;
}

export interface MarkDocPluginOptions {
	type?: 'html' | 'react-static' | MarkDocRenderer;
	argParse?: ParserArgs | undefined;
	transformConfig?: ConfigType | undefined;
}
