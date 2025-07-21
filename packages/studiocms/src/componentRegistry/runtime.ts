import { componentKeys, componentProps } from 'studiocms:component-registry';
import * as registry from 'studiocms:component-registry';
import logger from 'studiocms:logger';
import { StudioCMSRendererError, prefixError } from '../lib/renderer/errors.js';
import { convertUnderscoresToHyphens } from './convert-hyphens.js';
import type { ComponentRegistryEntry as _ComponentRegistryEntry } from './types.js';

export * from './convert-hyphens.js';

export { componentProps };

export interface ComponentRegistryEntry extends _ComponentRegistryEntry {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Component: (_props: any) => any;
}

/**
 * Asynchronously retrieves and constructs a registry of components.
 *
 * This function maps over the `componentProps` array, retrieves the corresponding component
 * from the `registry` object by name, and throws an error if the component is not found.
 * It then returns an object mapping each component's `safeName` (converted from underscores
 * to hyphens) to its corresponding `ComponentRegistryEntry`.
 *
 * @throws {StudioCMSRendererError} If a component specified in `componentProps` is not found in the registry.
 * @returns {Promise<Record<string, ComponentRegistryEntry>>} An object mapping safe component names to their registry entries.
 */
export async function getRegistryComponents(): Promise<Record<string, ComponentRegistryEntry>> {
	try {
		const components = componentProps.map((entry) => {
			const component = registry[entry.safeName as keyof typeof registry] as unknown as (
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				_props: any
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			) => any;
			if (!component) {
				throw new StudioCMSRendererError(`Component "${entry.name}" not found in registry.`);
			}
			return {
				...entry,
				Component: component,
			} as ComponentRegistryEntry;
		});

		const toReturn: Record<string, ComponentRegistryEntry> = {};

		for (const component of components) {
			toReturn[convertUnderscoresToHyphens(component.safeName)] = component;
		}

		return toReturn;
	} catch (e) {
		if (e instanceof Error) {
			const newErr = prefixError(
				e,
				`Failed to import component from Virtual Module "studiocms:component-registry"`
			);
			logger.error(newErr);
			throw new StudioCMSRendererError(newErr.message, newErr.stack);
		}
		const newErr = prefixError(
			new Error('Unknown error'),
			`Failed to import component from Virtual Module "studiocms:component-registry"`
		);
		logger.error(newErr);
		throw new StudioCMSRendererError(newErr.message, newErr.stack);
	}
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
