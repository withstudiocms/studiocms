import { componentKeys, componentProps } from 'studiocms:component-registry';
import * as registry from 'studiocms:component-registry';
import logger from 'studiocms:logger';
import { StudioCMSRendererError, prefixError } from '../lib/renderer/errors.js';
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
 * Use `getRegistryComponents` instead for importing components from the component registry.
 */
export async function importComponentsKeys() {
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
