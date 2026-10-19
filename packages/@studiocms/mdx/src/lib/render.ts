import { compile, run } from '@mdx-js/mdx';
import { createElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToString } from 'react-dom/server';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { restrictMdx, studiocmsSchema } from './restrict-mdx.js';
import { shared } from './shared.js';

const baseRemarkPlugins = [remarkGfm];
const baseRehypePlugins = [rehypeHighlight];

const { recmaPlugins, rehypePlugins, remarkPlugins, remarkRehypeOptions } = shared.mdxConfig;

const makeList = (...pluginLists: (PluggableList | undefined)[]): PluggableList =>
	pluginLists.flatMap((plugins) => plugins ?? []);

export async function renderMDX(content: string): Promise<string> {
	const compiledCode = await compile(content, {
		outputFormat: 'function-body', // Essential: Outputs MDX as a pure string evaluation block
		remarkPlugins: makeList(baseRemarkPlugins, remarkPlugins, [restrictMdx]),
		rehypePlugins: makeList(baseRehypePlugins, rehypePlugins, [[rehypeSanitize, studiocmsSchema]]),
		recmaPlugins: recmaPlugins,
		remarkRehypeOptions: remarkRehypeOptions,
	});

	const { default: MDXContent } = await run(compiledCode, { ...runtime });

	return renderToString(createElement(MDXContent));
}

export default renderMDX;
