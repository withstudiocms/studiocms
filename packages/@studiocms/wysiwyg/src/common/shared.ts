import type { WYSIWYGSchemaOptions } from '../types.js';

declare global {
	var studiocmsWYSIWYG: WYSIWYGSchemaOptions;
}

/**
 * A shared object used across the WYSIWYG module. This object is either retrieved
 * from the global `studiocmsWYSIWYG` property or initialized as a new object with
 * default properties if it does not already exist.
 *
 * @remarks
 * The `sanitize` property is initialized as an empty object and can be used to store
 * sanitization-related configurations or utilities.
 */
export const shared: WYSIWYGSchemaOptions =
	globalThis.studiocmsWYSIWYG ||
	// biome-ignore lint/suspicious/noAssignInExpressions: This is a valid use case.
	(globalThis.studiocmsWYSIWYG = {
		sanitize: undefined,
	});
