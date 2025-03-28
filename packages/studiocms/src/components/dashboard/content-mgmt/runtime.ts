import * as mod from 'virtual:studiocms/components/Editors';
import { StudioCMSError } from '../../../errors.js';
import { prefixError } from '../../../lib/renderer/errors.js';
import { convertToSafeString } from '../../../utils/safeString.js';

export { convertToSafeString };

/**
 * Imports components by their keys from the 'studiocms:markdown-remark/user-components' module.
 *
 * @param keys - An array of strings representing the keys of the components to import.
 * @returns A promise that resolves to an object containing the imported components.
 * @throws {MarkdownRemarkError} If any component fails to import, an error is thrown with a prefixed message.
 */
export async function importEditorKeys(keys: string[]) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const predefinedComponents: Record<string, any> = {};

	for (const key of keys) {
		try {
			predefinedComponents[convertToSafeString(key)] =
				// @ts-ignore
				mod[convertToSafeString(key)];
		} catch (e) {
			if (e instanceof Error) {
				const newErr = prefixError(
					e,
					`Failed to import component "${key}" from Virtual Module "virtual:studiocms/components/Editors"`
				);
				console.error(newErr);
				throw new StudioCMSError(newErr.message, newErr.stack);
			}
			const newErr = prefixError(
				new Error('Unknown error'),
				`Failed to import component "${key}" from Virtual Module "virtual:studiocms/components/Editors"`
			);
			console.error(newErr);
			throw new StudioCMSError(newErr.message, newErr.stack);
		}
	}

	return predefinedComponents;
}
