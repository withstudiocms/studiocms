import type { SSRResult } from 'astro';
import { jsx } from 'astro/jsx-runtime';
import { renderJSX } from 'astro/runtime/server/jsx.js';
import { __unsafeHTML, transform } from 'ultrahtml';
import sanitize, { type SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import swap from 'ultrahtml/transformers/swap';
import { decode } from './decoder';

/**
 * Creates a proxy for components that can either be strings or functions.
 * If the component is a string, it is directly assigned to the proxy.
 * If the component is a function, it is wrapped in an async function that
 * processes the props and children before rendering.
 *
 * @param result - The result object used for rendering JSX.
 * @param _components - An optional record of components to be proxied. Defaults to an empty object.
 * @returns A record of proxied components.
 */
export function createComponentProxy(
	result: SSRResult,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	_components: Record<string, any> = {}
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const components: Record<string, any> = {};
	for (const [key, value] of Object.entries(_components)) {
		if (typeof value === 'string') {
			components[key.toLowerCase()] = value;
		} else {
			components[key.toLowerCase()] = async (
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				props: Record<string, any>,
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				children: { value: any }
			) => {
				if (key === 'codeblock' || key === 'codespan') {
					props.code = decode(JSON.parse(`"${props.code}"`));
				}
				const output = await renderJSX(
					result,
					jsx(value, { ...props, 'set:html': children.value })
				);
				return __unsafeHTML(output);
			};
		}
	}
	return components;
}

/**
 * Determines the indentation of a given line of text.
 *
 * @param ln - The line of text to analyze.
 * @returns The leading whitespace characters of the line, or an empty string if there is no indentation.
 */
function getIndent(ln: string): string {
	if (ln.trimStart() === ln) return '';
	return ln.slice(0, ln.length - ln.trimStart().length);
}

/**
 * Removes leading indentation from a multi-line string.
 *
 * @param str - The string from which to remove leading indentation.
 * @returns The dedented string.
 */
export function dedent(str: string): string {
	const lns = str.replace(/^[\r\n]+/, '').split('\n');
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	let indent = getIndent(lns[0]!);
	if (indent.length === 0 && lns.length > 1) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		indent = getIndent(lns[1]!);
	}
	if (indent.length === 0) return lns.join('\n');
	return lns.map((ln) => (ln.startsWith(indent) ? ln.slice(indent.length) : ln)).join('\n');
}

export async function transformHTML(
	html: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	components: Record<string, any>,
	sanitizeOpts?: SanitizeOptions
): Promise<string> {
	return await transform(dedent(html), [sanitize(sanitizeOpts), swap(components)]);
}
