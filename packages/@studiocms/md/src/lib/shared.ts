import type { AstroConfig } from 'astro';
import type { MarkdownSchemaOptions } from '../types.js';

export const symbol: symbol = Symbol.for('@studiocms/md');

/**
 * A shared object that is either retrieved from the global scope using a symbol or
 * initialized as a new object with a `mdxConfig` property.
 *
 * @remarks
 * The `@ts-expect-error` comments are used to suppress TypeScript errors related to the use of
 * the global scope and assignment within expressions. The `biome-ignore` comment is used
 * to suppress linting errors for the same reason.
 */
export const shared: {
	mdConfig?: MarkdownSchemaOptions | undefined;
	astroMDRemark?: AstroConfig['markdown'] | undefined;
} =
	// @ts-expect-error
	globalThis[symbol] ||
	// @ts-expect-error
	(globalThis[symbol] = {
		mdConfig: undefined,
		astroMDRemark: undefined,
	});
