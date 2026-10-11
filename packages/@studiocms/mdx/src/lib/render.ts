import vm from 'node:vm';
import { compile } from '@mdx-js/mdx';
import { createElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToString } from 'react-dom/server';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { shared } from './shared.js';

const baseRemarkPlugins = [remarkGfm];
const baseRehypePlugins = [rehypeHighlight];

const { recmaPlugins, rehypePlugins, remarkPlugins, remarkRehypeOptions } = shared.mdxConfig;

const makeList = (included: PluggableList, userDefinedPlugins?: PluggableList): PluggableList => {
	const Plugins: PluggableList = [...included];

	if (userDefinedPlugins) {
		for (const plugin of userDefinedPlugins) {
			Plugins.push(plugin);
		}
	}

	return Plugins;
};

export async function renderMDX(content: string): Promise<string> {
	const compiledCode = await compile(content, {
		outputFormat: 'function-body', // Essential: Outputs MDX as a pure string evaluation block
		remarkPlugins: makeList(baseRemarkPlugins, remarkPlugins),
		rehypePlugins: makeList(baseRehypePlugins, rehypePlugins),
		recmaPlugins: recmaPlugins,
		remarkRehypeOptions: remarkRehypeOptions,
	});

	const sandbox = {
		_jsx: runtime.jsx,
		_jsxs: runtime.jsxs,
		_Fragment: runtime.Fragment,
		components: {},
		globalThis: {},
		// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
		exports: {} as Array<any> & { default?: any },
	};

	vm.createContext(sandbox);

	const executionWrapper = `
		(function(exports, _jsx, _jsxs, _Fragment) {
			${compiledCode.toString()}
		})(exports, _jsx, _jsxs, _Fragment);
	`;

	const script = new vm.Script(executionWrapper);
	script.runInContext(sandbox, {
		timeout: 1000, // Defends against infinite loops / CPU exhaustion attacks
		breakOnSigint: true,
	});

	const MDXContent = sandbox.exports.default;

	if (!MDXContent || typeof MDXContent !== 'function') {
		throw new Error('Invalid MDX Content payload produced during isolation runtime.');
	}

	return renderToString(createElement(MDXContent));
}

export default renderMDX;
