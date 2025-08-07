import { SDKCore } from 'studiocms:sdk';
import { Effect, Schema } from 'studiocms/effect';

// this is used for testing, and is planned to be used in the future

/**
 * Schema definition for an array containing elements of any type.
 */
const AnyArray = Schema.Array(Schema.Any);

/**
 * Schema definition for StudioCMS project data.
 *
 * This schema describes the structure of the project data used in StudioCMS,
 * including optional HTML content, data sources, assets, styles, symbols, and pages.
 * 
 */
export const studioCMSProjectDataSchema = Schema.Struct({
	__STUDIOCMS_HTML: Schema.optional(Schema.String),
	dataSources: AnyArray,
	assets: AnyArray,
	styles: AnyArray,
	symbols: AnyArray,
	pages: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			frames: Schema.Array(
				Schema.Struct({
					id: Schema.String,
					component: Schema.Struct({
						type: Schema.String,
						stylable: AnyArray,
						attributes: Schema.Record({ key: Schema.String, value: Schema.Any }),
						components: AnyArray,
						head: Schema.Struct({
							type: Schema.String,
						}),
						docEl: Schema.Struct({
							tagName: Schema.String,
						}),
					}),
				})
			),
		})
	),
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
	const { Insert: inferInsertType, usePluginData: inferUsePluginData } = new InferType(
		studioCMSProjectDataSchema
	);

	/**
	 * Type representing the structure of the plugin data used in StudioCMS.
	 * This type is inferred from the `studioCMSProjectDataSchema` schema.
	 */
	type SchemaType = typeof inferUsePluginData;

	/**
	 * Type representing the structure of the data that can be inserted into the plugin.
	 * This type is inferred from the `Insert` property of the `InferType` class.
	 * It represents a simplified, mutable version of the schema's type.
	 *
	 * @typeParam T - The type of data to be inserted, inferred from the schema.
	 */
	type InferInsertType = typeof inferInsertType;

	// This function provides access to the plugin data for the WYSIWYG editor.
	const { getEntries } = usePluginData<SchemaType>(TABLE_PLUGIN_ID, {
		validator: { effectSchema: studioCMSProjectDataSchema },
	});

	// This function retrieves all entries of the plugin data, allowing for interaction with the WYSIWYG editor's stored data.
	const createPluginDataAccessorById = (id: string) =>
		usePluginData<SchemaType>(TABLE_PLUGIN_ID, {
			entryId: id,
			validator: { effectSchema: studioCMSProjectDataSchema },
		});

	return {
		/**
		 * Retrieves all entries of the plugin data for the WYSIWYG editor.
		 *
		 * @returns An array of all plugin data entries.
		 */
		getAll: () => getEntries(),

		/**
		 * Retrieves a specific entry of the plugin data by its ID.
		 *
		 * @param id - The unique identifier for the plugin data entry.
		 * @returns An Effect that resolves to the plugin data entry with the specified ID.
		 */
		load: Effect.fn(function* (id: string) {
			return yield* createPluginDataAccessorById(id).select();
		}),

		/**
		 * Inserts or updates a plugin data entry with the specified ID and data.
		 *
		 * @param id - The unique identifier for the plugin data entry.
		 * @param data - The data to be inserted or updated in the plugin data entry.
		 * @returns An Effect that resolves to the inserted or updated plugin data entry.
		 */
		store: Effect.fn(function* (id: string, data: InferInsertType) {
			const existing = yield* createPluginDataAccessorById(id).select();
			if (existing) {
				return yield* createPluginDataAccessorById(id).update(data);
			}
			return yield* createPluginDataAccessorById(id).insert(data);
		}),
	};
});
