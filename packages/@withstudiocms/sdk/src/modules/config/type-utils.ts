import { Effect } from '@withstudiocms/effect';
import type { DynamicConfigEntry } from '../../types.js';

/**
 * Casts the given id and data into a DynamicConfigEntry.
 *
 * @template T - The type of the data in the configuration entry.
 * @param param0 - An object containing the id and data.
 * @returns An effect that yields a DynamicConfigEntry with the given id and data.
 */
export const castData = <T>({
	id,
	data,
}: {
	id: string;
	data: T;
}): Effect.Effect<DynamicConfigEntry<T>> =>
	Effect.succeed({
		id,
		data,
	});
