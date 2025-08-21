import * as registry from 'virtual:component-registry-internal-proxy';
import { componentKeys, componentProps } from 'virtual:component-registry-internal-proxy';
import { name } from 'virtual:component-registry-internal-proxy/name';
import type { SSRResult } from 'astro';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import { createComponentProxy } from './component-proxy/index.js';
import { toComponentProxyError } from './errors.js';
import { transformHTML } from './transform-html.js';
import type { ComponentRegistryEntry } from './types.js';
import { convertUnderscoresToHyphens } from './utils.js';

export * from './utils.js';

export { componentProps };
export type { ComponentRegistryEntry } from './types.js';

/**
 * Returns the component registry entries.
 *
 * @returns {ComponentRegistryEntry[]} An object mapping safe component names to their registry entries.
 */
export function getRegistryComponents(): ComponentRegistryEntry[] {
	return componentProps;
}

/**
 * Constructs an error message prefix indicating a failure to import a component.
 *
 * @param key - The key or identifier of the component that failed to import.
 * @param name - The name of the component registry or source.
 * @returns A formatted error message string describing the import failure.
 */
const buildPrefix = (key: string, name: string) =>
	`Failed to import component "${key}" from [${name}] component-registry`;

/**
 * @returns A promise that resolves to an object containing the imported components.
 */
export async function getRendererComponents() {
	// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any.
	const predefinedComponents: Record<string, any> = {};

	for (const key of componentKeys) {
		try {
			predefinedComponents[convertUnderscoresToHyphens(key)] =
				registry[key as keyof typeof registry];
		} catch (e) {
			if (e instanceof Error) {
				throw toComponentProxyError(e, buildPrefix(key, name));
			}
			throw toComponentProxyError(new Error('Unknown error'), buildPrefix(key, name));
		}
	}

	return predefinedComponents;
}

/**
 * Sets up a component proxy for the renderer.
 *
 * @param result - The SSRResult object from Astro.
 * @returns A promise that resolves to a component proxy containing the components.
 * @throws {ComponentProxyError} If there is an error during setup, it will be prefixed and logged.
 */
export async function setupRendererComponentProxy(result: SSRResult) {
	const components = await getRendererComponents();
	return createComponentProxy(result, components);
}

/**
 * Creates a renderer function that transforms HTML content using the provided components and sanitization options.
 *
 * @param result - The SSRResult object from Astro.
 * @param sanitizeOpts - Optional sanitization options for the HTML content.
 * @param preRenderer - An optional function to preprocess the HTML content before rendering.
 * @returns A function that takes HTML content as input and returns the transformed HTML.
 */
export async function createRenderer(
	result: SSRResult,
	sanitizeOpts?: SanitizeOptions,
	preRenderer?: (content: string) => Promise<string>
) {
	const components = await setupRendererComponentProxy(result);
	return async (content: string) => {
		let html: string;
		if (preRenderer && typeof preRenderer === 'function') {
			html = await preRenderer(content);
		} else {
			html = content;
		}
		return await transformHTML(html, components, sanitizeOpts);
	};
}
