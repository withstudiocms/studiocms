import vm from 'node:vm';
import { compile } from '@mdx-js/mdx';
import { createElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToString } from 'react-dom/server';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { restrictMdx } from './restrict-mdx.js';
import { shared } from './shared.js';

const baseRemarkPlugins = [remarkGfm];
const baseRehypePlugins = [rehypeHighlight];
const sanitizeSchema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		span: [...(defaultSchema.attributes?.span ?? []), ['className', /^hljs-/]],
	},
};

const { recmaPlugins, rehypePlugins, remarkPlugins, remarkRehypeOptions } = shared.mdxConfig;

const makeList = (...pluginLists: (PluggableList | undefined)[]): PluggableList =>
	pluginLists.flatMap((plugins) => plugins ?? []);

export async function renderMDX(content: string): Promise<string> {
	const compiledCode = await compile(content, {
		outputFormat: 'function-body', // Essential: Outputs MDX as a pure string evaluation block
		remarkPlugins: makeList(baseRemarkPlugins, remarkPlugins, [restrictMdx]),
		rehypePlugins: makeList(baseRehypePlugins, rehypePlugins, [[rehypeSanitize, sanitizeSchema]]),
		recmaPlugins: recmaPlugins,
		remarkRehypeOptions: remarkRehypeOptions,
	});

	const sandbox = { runtime };

	vm.createContext(sandbox);

	const executionWrapper = `
		(function(runtime) {
			${compiledCode.toString()}
		})(runtime);
	`;

	const script = new vm.Script(executionWrapper);
	const compiledModule = script.runInContext(sandbox, {
		timeout: 1000, // Limits function-body evaluation only; React rendering is not covered.
		breakOnSigint: true,
	});

	const MDXContent = compiledModule?.default;

	if (!MDXContent || typeof MDXContent !== 'function') {
		throw new Error('Invalid MDX content: compiler output did not provide a default component.');
	}

	return renderToString(createElement(MDXContent));
}

export default renderMDX;
