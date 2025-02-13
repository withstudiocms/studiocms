import rendererConfig from 'studiocms:renderer/config';
import Markdoc, { type ConfigType, type ParserArgs } from '@markdoc/markdoc';
import type { MarkdocRenderer } from '../../schemas/config/rendererConfig.js';
import { StudioCMSRendererError } from './errors.js';
import renderHTML from './markdoc-renderers/markdocHTML.js';
import renderReactStatic from './markdoc-renderers/markdocReactStatic.js';

// Destructure the Markdoc configuration from the rendererConfig
const {
	markdocConfig: { argParse, transformConfig, renderType },
} = rendererConfig;

const renderers: MarkdocRenderer[] = [renderHTML(), renderReactStatic()];

/**
 * Render a Markdown string into HTML using the Markdoc renderer
 *
 * Markdoc is a powerful, flexible, Markdown-based authoring framework. Built by Stripe.
 * @see https://markdoc.dev/ for more info about markdoc.
 *
 * @param input - The Markdown string to render
 * @returns The rendered HTML string
 */
export async function renderMarkDoc(input: string): Promise<string> {
	// Parse the input string into an AST
	const ast = Markdoc.parse(input, argParse as ParserArgs);

	// Transform the AST into content
	const content = Markdoc.transform(ast, transformConfig as ConfigType);
	const renderer = renderers.find((r) => r.name === renderType);
	if (renderer) {
		return renderer.renderer(content as string);
	}
	if (
		renderType !== 'html' &&
		renderType !== 'react-static' &&
		renderType.name &&
		renderType.renderer
	) {
		return renderType.renderer(content as string).catch((e) => {
			throw new Error(`Failed to render content with custom renderer: [${renderType.name}]: ${e}`);
		});
	}
	throw new StudioCMSRendererError(`Unknown MarkDoc render type: ${renderType}`);
}

export default renderMarkDoc;
