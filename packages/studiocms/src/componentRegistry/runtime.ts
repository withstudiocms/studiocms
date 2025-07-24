import { componentKeys, componentProps } from 'studiocms:component-registry';
import * as registry from 'studiocms:component-registry';
import logger from 'studiocms:logger';
import type { SSRResult } from 'astro';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import { StudioCMSRendererError, prefixError } from '../lib/renderer/errors.js';
import { createComponentProxy, transformHTML } from '../runtime/AstroComponentProxy.js';
import { convertUnderscoresToHyphens } from './convert-hyphens.js';
import type { ComponentRegistryEntry } from './types.js';

export * from './convert-hyphens.js';

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
 * @returns A promise that resolves to an object containing the imported components.
 */
export async function getRendererComponents() {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const predefinedComponents: Record<string, any> = {};

	for (const key of componentKeys) {
		try {
			predefinedComponents[convertUnderscoresToHyphens(key)] =
				registry[key as keyof typeof registry];
		} catch (e) {
			if (e instanceof Error) {
				const newErr = prefixError(
					e,
					`Failed to import component "${key}" from Virtual Module "studiocms:component-registry"`
				);
				logger.error(newErr);
				throw new StudioCMSRendererError(newErr.message, newErr.stack);
			}
			const newErr = prefixError(
				new Error('Unknown error'),
				`Failed to import component "${key}" from Virtual Module "studiocms:component-registry"`
			);
			logger.error(newErr);
			throw new StudioCMSRendererError(newErr.message, newErr.stack);
		}
	}

	return predefinedComponents;
}

/**
 * Imports components by their keys from the 'studiocms:markdown-remark/user-components' module.
 *
 * @param keys - An array of strings representing the keys of the components to import.
 * @returns A promise that resolves to an object containing the imported components.
 * @throws {MarkdownRemarkError} If any component fails to import, an error is thrown with a prefixed message.
 * @deprecated This function is deprecated and will be removed in future versions.
 * Use `getRendererComponents` instead for importing components from the component registry.
 */
export async function importComponentsKeys() {
	return getRendererComponents();
}

export async function setupRendererComponentProxy(result: SSRResult) {
	const components = await getRendererComponents();
	return createComponentProxy(result, components);
}

export async function createRenderer(
	result: SSRResult,
	sanitizeOpts?: SanitizeOptions,
	preRenderer?: (content: string) => Promise<string>
) {
	const components = setupRendererComponentProxy(result);
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
