import { componentKeys } from 'studiocms:component-proxy';
import * as mod from 'studiocms:component-proxy';
import logger from 'studiocms:logger';
import { convertUnderscoresToHyphens } from '../../utils/convert-hyphens.js';
import { StudioCMSRendererError, prefixError } from './errors.js';

/**
 * Imports components by their keys from the 'studiocms:markdown-remark/user-components' module.
 *
 * @param keys - An array of strings representing the keys of the components to import.
 * @returns A promise that resolves to an object containing the imported components.
 * @throws {MarkdownRemarkError} If any component fails to import, an error is thrown with a prefixed message.
 */
export async function importComponentsKeys() {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const predefinedComponents: Record<string, any> = {};

	for (const key of componentKeys) {
		try {
			// @ts-ignore
			predefinedComponents[convertUnderscoresToHyphens(key.toLowerCase())] = mod[key.toLowerCase()];
		} catch (e) {
			if (e instanceof Error) {
				const newErr = prefixError(
					e,
					`Failed to import component "${key}" from Virtual Module "studiocms:component-proxy"`
				);
				logger.error(newErr);
				throw new StudioCMSRendererError(newErr.message, newErr.stack);
			}
			const newErr = prefixError(
				new Error('Unknown error'),
				`Failed to import component "${key}" from Virtual Module "studiocms:component-proxy"`
			);
			logger.error(newErr);
			throw new StudioCMSRendererError(newErr.message, newErr.stack);
		}
	}

	return predefinedComponents;
}
