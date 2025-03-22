import type { MDXPluginOptions } from '../types.js';

export const symbol: symbol = Symbol.for('@studiocms/mdx');

/**
 * A shared object that is either retrieved from the global scope using a symbol or
 * initialized as a new object with a `markdownConfig` property.
 *
 * @constant
 * @type {Shared}
 *
 * @remarks
 * The `@ts-ignore` comments are used to suppress TypeScript errors related to the use of
 * the global scope and assignment within expressions. The `biome-ignore` comment is used
 * to suppress linting errors for the same reason.
 */
export const shared: { mdxConfig: MDXPluginOptions } =
	// @ts-ignore
	globalThis[symbol] ||
	// @ts-ignore
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	(globalThis[symbol] = {
		mdxConfig: {},
	});
