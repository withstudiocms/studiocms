import { type Transformer, transform } from 'ultrahtml';
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
	sanitizeOpts: SanitizeOptions = {},
	transformers?: Transformer[]
): Promise<string> {
	const allTransformers = [
		...(transformers ?? []),
		// We enable allowComponents and allowCustomElements to ensure that custom components are not stripped out during sanitization.
		// This is important because the swap transformer relies on these elements being present to perform the component swapping.
		// Users can still control other aspects of sanitization via the sanitizeOpts parameter.
		sanitize({ ...sanitizeOpts, allowComponents: true, allowCustomElements: true }),
		swap(components),
	];
	return await transform(dedent(html), allTransformers);
}
