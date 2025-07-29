import type { AstroConfig } from 'astro';
import type { MarkdownSchemaOptions } from '../types.js';

export const symbol: symbol = Symbol.for('@studiocms/md');

/**
 * A shared object that is either retrieved from the global scope using a symbol or
 * initialized as a new object with a `mdxConfig` property.
 *
 * @remarks
 * The `@ts-ignore` comments are used to suppress TypeScript errors related to the use of
 * the global scope and assignment within expressions. The `biome-ignore` comment is used
 * to suppress linting errors for the same reason.
 */
export const shared: {
	mdConfig?: MarkdownSchemaOptions | undefined;
	astroMDRemark?: AstroConfig['markdown'] | undefined;
} =
	// @ts-ignore
	globalThis[symbol] ||
	// @ts-ignore
	// biome-ignore lint/suspicious/noAssignInExpressions: This is a valid use case for assignment in expressions.
	(globalThis[symbol] = {
		mdConfig: undefined,
		astroMDRemark: undefined,
	});
