import { evaluate } from '@mdx-js/mdx';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { shared } from './shared.js';

const baseRemarkPlugins = [remarkGfm];
const baseRehypePlugins = [rehypeHighlight];

const { recmaPlugins, rehypePlugins, remarkPlugins, remarkRehypeOptions } = shared.mdxConfig;

const makeList = (included: PluggableList, userDefinedPlugins?: PluggableList): PluggableList => {
	const Plugins: PluggableList = included;

	if (userDefinedPlugins) {
		for (const plugin of userDefinedPlugins) {
			Plugins.push(plugin);
		}
	}

	return Plugins;
};

export async function renderMDX(content: string): Promise<string> {
	const { default: MDXContent } = await evaluate(content, {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		...(runtime as any),
		remarkPlugins: makeList(baseRemarkPlugins, remarkPlugins),
		rehypePlugins: makeList(baseRehypePlugins, rehypePlugins),
		recmaPlugins: recmaPlugins,
		remarkRehypeOptions: remarkRehypeOptions,
	});

	return renderToString(createElement(MDXContent));
}

export default renderMDX;
