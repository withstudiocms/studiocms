import { createRenderer } from 'studiocms:component-registry/runtime';
import { createComponentProxy, transformHTML } from '@withstudiocms/component-registry';
import type { SSRResult } from 'astro';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import type { GenericAsyncFn, PrefixSuffixAugment, RenderAugment } from '../../types';

/**
 * Concatenates the provided HTML string as either a prefix or suffix to the given content.
 *
 * @param type - Determines whether the HTML should be added as a 'prefix' or 'suffix' to the content.
 * @param html - The HTML string to be added.
 * @param content - The main content string to which the HTML will be attached.
 * @returns The resulting string with the HTML added as specified by the type.
 */
const handlePrefixSuffix = (augment: PrefixSuffixAugment, content: string) =>
	augment.type === 'prefix' ? augment.html + content : content + augment.html;

/**
 * Options for creating a render function.
 *
 * @property result - The SSRResult object containing the server-side rendering context and data.
 * @property sanitizeOpts - Optional. Configuration options for content sanitization.
 * @property preRenderer - Optional. An asynchronous function that processes the rendered content before final output.
 */
interface CreateRenderOptions {
	result: SSRResult;
	sanitizeOpts?: SanitizeOptions;
	preRenderer?: GenericAsyncFn<string>;
}

/**
 * Options for the render function.
 *
 * @property renderOpts - The options used to create the render context.
 * @property augments - Optional array of render augmentations to apply.
 * @property content - The content string to be rendered.
 */
export interface RenderFnOptions {
	renderOpts: CreateRenderOptions;
	augments?: RenderAugment[];
	content: string;
}

/**
 * Asynchronously renders content to HTML, applying optional sanitization, pre-rendering,
 * and a sequence of augmentations (such as prefix, suffix, or component transformations).
 */
export const renderFn = async (args: RenderFnOptions) => {
	// Destructure arguments for easier access
	const { renderOpts, content, augments = [] } = args;
	const { result, sanitizeOpts, preRenderer } = renderOpts;

	// Create the initial renderer
	const render = await createRenderer(result, sanitizeOpts, preRenderer);

	// Render content to HTML before applying augments
	let renderedContent = await render(content);

	// Apply augments in the order they are provided
	for (const augment of augments) {
		// Extract components from augment (all augments have components)
		const { components: _components = {} } = augment;

		// Create a component proxy with the provided components
		const components = createComponentProxy(result, _components);

		// Handle prefix/suffix augments by concatenating HTML
		if (augment.type === 'prefix' || augment.type === 'suffix') {
			renderedContent = handlePrefixSuffix(augment, renderedContent);
		}

		// Transform the content with the new components and update renderedContent
		renderedContent = await transformHTML(renderedContent, components);
	}

	// Return the final rendered content
	return renderedContent;
};

export default renderFn;
