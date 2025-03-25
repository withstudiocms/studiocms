import type { Shared } from './types.js';

declare global {
	var studiocmsBuiltInRendererConfig: Shared;
}

/**
 * A shared object that is either retrieved from the global scope using a symbol or
 * initialized as a new object with a `markdownConfig` property.
 *
 * @constant
 * @type {Shared}
 */
export const shared: Shared =
	globalThis.studiocmsBuiltInRendererConfig ||
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	(globalThis.studiocmsBuiltInRendererConfig = {
		astroMDRemark: undefined,
		studiocmsMarkdown: undefined,
		studiocmsHTML: undefined,
	});
