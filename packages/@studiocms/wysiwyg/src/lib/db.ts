import { SDKCore } from 'studiocms:sdk';
import type { PluginDataEntry } from 'studiocms:sdk/types';
import { Effect, Schema } from 'studiocms/effect';
import { AnyArray, MArrayStruct, MRecord, MString, MStruct } from './schema.js';

/**
 * Schema definition for StudioCMS project data.
 *
 * This schema describes the structure of the project data used in StudioCMS,
 * including optional HTML content, data sources, assets, styles, symbols, and pages.
 *
 */
export const studioCMSProjectDataSchema = Schema.Struct({
	__STUDIOCMS_HTML: Schema.optional(MString),
	dataSources: AnyArray,
	assets: AnyArray,
	styles: AnyArray,
	symbols: AnyArray,
	pages: MArrayStruct({
		id: MString,
		name: MString,
		frames: MArrayStruct({
			id: MString,
			component: MStruct({
				type: MString,
				stylable: AnyArray,
				attributes: MRecord({ key: Schema.String, value: Schema.Any }),
				components: AnyArray,
				head: MStruct({
					type: MString,
				}),
				docEl: MStruct({
					tagName: MString,
				}),
			}),
		}),
	}),
});

/**
 * The unique identifier for the WYSIWYG plugin within the StudioCMS ecosystem.
 * Used to register and reference the plugin in the system.
 */
export const TABLE_PLUGIN_ID = 'studiocms-wysiwyg';

/**
 * Provides an SDK for interacting with StudioCMS plugin data using Effect-based operations.
 *
 * This generator function yields an object with methods to retrieve, load, and store
 * WYSIWYG editor plugin data, leveraging schema inference for type safety.
 *
 * @remarks
 * - Utilizes `InferType` to infer types from `studioCMSProjectDataSchema`.
 * - All operations are effectful and return Effect-based results.
 *
 * @returns An object containing methods for plugin data access:
 * - `getAll`: Retrieves all plugin data entries.
 * - `load`: Loads a specific plugin data entry by ID.
 * - `store`: Inserts or updates a plugin data entry by ID.
 *
 * @example
 * ```typescript
 * const sdk = yield* UseSDK;
 * const allEntries = sdk.getAll();
 * const entry = yield* sdk.load('entry-id');
 * yield* sdk.store('entry-id', { ...data });
 * ```
 */
export const UseSDK = Effect.gen(function* () {
	const {
		PLUGINS: { usePluginData, InferType },
	} = yield* SDKCore;

	// InferType is a utility class that helps infer types from a given schema.
	const infer = new InferType(studioCMSProjectDataSchema);

	// Define the type for the plugin data entry using the inferred schema.
	type InferInsert = typeof infer.$Insert;

	// This function provides access to the plugin data for the WYSIWYG editor.
	const { getEntries, getEntry } = usePluginData<typeof infer.$UsePluginData>(TABLE_PLUGIN_ID, {
		validator: { effectSchema: studioCMSProjectDataSchema },
	});

	// This function updates or inserts a plugin data entry based on whether it exists.
	// If the entry exists, it updates the existing entry; otherwise, it inserts a new entry.
	const updateOrInsert =
		(entry?: PluginDataEntry<InferInsert>) => (id: string, data: InferInsert) => {
			// If the entry exists, update it; otherwise, insert a new entry.
			if (entry) return getEntry(id).update(data);
			return getEntry(id).insert(data);
		};

	return {
		/**
		 * Retrieves all entries of the plugin data for the WYSIWYG editor.
		 *
		 * @returns An array of all plugin data entries.
		 */
		getAll: () => getEntries((data) => data.filter((entry) => entry.data.__STUDIOCMS_HTML)),

		/**
		 * Retrieves a specific entry of the plugin data by its ID.
		 *
		 * @param id - The unique identifier for the plugin data entry.
		 * @returns An Effect that resolves to the plugin data entry with the specified ID.
		 */
		load: (id: string) => getEntry(id).select(),

		/**
		 * Inserts or updates a plugin data entry with the specified ID and data.
		 *
		 * @param id - The unique identifier for the plugin data entry.
		 * @param data - The data to be inserted or updated in the plugin data entry.
		 * @returns An Effect that resolves to the inserted or updated plugin data entry.
		 */
		store: (id: string, data: InferInsert) =>
			getEntry(id)
				.select()
				.pipe(Effect.flatMap((entry) => updateOrInsert(entry)(id, data))),

		/**
		 * Returns the inferred type for the plugin data schema.
		 */
		types: infer,
	};
});
