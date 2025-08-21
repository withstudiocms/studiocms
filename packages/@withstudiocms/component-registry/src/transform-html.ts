import { transform } from 'ultrahtml';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import sanitize from 'ultrahtml/transformers/sanitize';
import swap from 'ultrahtml/transformers/swap';
import type { ComponentType } from './types.js';
import { dedent } from './utils.js';

/**
 * Transforms the provided HTML string by applying sanitization and component swapping.
 *
 * @param html - The HTML string to be transformed.
 * @param components - A record of components to be swapped within the HTML. The keys are component names and the values are the corresponding component implementations.
 * @param sanitizeOpts - Optional sanitization options to be applied to the HTML.
 * @returns A promise that resolves to the transformed HTML string.
 */
export async function transformHTML(
	html: string,
	components: ComponentType,
	sanitizeOpts?: SanitizeOptions
): Promise<string> {
	return await transform(dedent(html), [sanitize(sanitizeOpts), swap(components)]);
}
