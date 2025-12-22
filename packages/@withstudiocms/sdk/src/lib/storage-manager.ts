import { Effect } from '@withstudiocms/effect';

/**
 * Resolves Storage Manager URLs for the specified attributes of the given object.
 *
 * @typeParam F - The type of the object containing the attributes to resolve.
 * @param obj - The object containing the attributes with Storage Manager URLs.
 * @param attributes - A single attribute key or an array of attribute keys to resolve.
 * @returns An Effect that resolves the specified attributes and returns the updated object.
 */
export const resolveStorageManagerUrls =
	(smResolver: (identifier: string) => Promise<string>) =>
	<F>(obj: F, attributes: keyof F | (keyof F)[]) =>
		Effect.gen(function* () {
			// If the object is nullish, return early
			if (!obj) return;

			// Prepare to build the updated object
			const initialObject: Partial<F> = obj;

			// Normalize attributes to an array
			const attrs = Array.isArray(attributes) ? attributes : [attributes];

			// Iterate over each attribute to resolve
			for (const attr of attrs) {
				// Get the current value of the attribute
				const entryData = initialObject[attr];

				// Check if the attribute value is a string and starts with the storage-file prefix
				if (typeof entryData !== 'string') return;
				if (!entryData.startsWith('storage-file://')) return;

				// Resolve the new URL using the storage manager resolver
				const newData = yield* Effect.tryPromise(() => smResolver(entryData));

				// Update the attribute with the resolved URL
				// biome-ignore lint/suspicious/noExplicitAny: reconstructing object
				(initialObject as any)[attr] = newData;
			}

			// Return the updated object cast to the original type
			return initialObject as F;
		});
