import type { MDXPluginOptions } from '../types.js';

export const symbol: symbol = Symbol.for('@studiocms/mdx');

/**
 * A shared object that is either retrieved from the global scope using a symbol or
 * initialized as a new object with a `mdxConfig` property.
 *
 * @remarks
 * The `@ts-expect-error` comments are used to suppress TypeScript errors related to the use of
 * the global scope and assignment within expressions. The `biome-ignore` comment is used
 * to suppress linting errors for the same reason.
 */
export const shared: { mdxConfig: MDXPluginOptions } =
	// @ts-expect-error
	globalThis[symbol] ||
	// @ts-expect-error
	// biome-ignore lint/suspicious/noAssignInExpressions: this is a valid use case for assignment in expressions.
	(globalThis[symbol] = {
		mdxConfig: {},
	});
