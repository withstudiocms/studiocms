import Config from 'studiocms:renderer/config';
import { evaluate } from '@mdx-js/mdx';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';

const {
	mdxConfig: { recmaPlugins, rehypePlugins, remarkPlugins, remarkRehypeOptions },
} = Config;

const makeList = (included: PluggableList, userDefinedPlugins?: PluggableList): PluggableList => {
	const Plugins: PluggableList = included;

	// Add any additional User-Defined remark plugins
	if (userDefinedPlugins) {
		for (const plugin of userDefinedPlugins) {
			Plugins.push(plugin);
		}
	}

	return Plugins;
};

// Include the default remark plugins
const includedRemarkPlugins = [remarkGfm];

// Include the default rehype plugins
const includedRehypePlugins = [rehypeHighlight];

/**
 * Render Astro MDX
 *
 * Renders Astro MDX content
 *
 * @param content - The content to render
 * @returns The rendered content
 */
export async function renderAstroMDX(content: string) {
	// Convert input content to MDX
	const { default: MDXContent } = await evaluate(content, {
		// biome-ignore lint/suspicious/noExplicitAny: react jsx-runtime is not typed
		...(runtime as any),
		remarkPlugins: makeList(includedRemarkPlugins, remarkPlugins),
		rehypePlugins: makeList(includedRehypePlugins, rehypePlugins),
		recmaPlugins: recmaPlugins,
		remarkRehypeOptions: remarkRehypeOptions,
	});

	// Render the MDX content to a string
	return renderToString(createElement(MDXContent));
}

export default renderAstroMDX;
