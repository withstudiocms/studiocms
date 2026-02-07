import { runSDK, SDKCoreJs } from 'studiocms:sdk';
import { StudioCMSStorageManagerUrlMappings } from '@withstudiocms/sdk/tables';
import { Schema } from 'effect';
import type { UrlMapping, UrlMappingDatabaseDefinition } from '../definitions';

const { withCodec, withDecoder, withEncoder } = SDKCoreJs.dbService;

/**
 * Get URL Mapping from Database.
 *
 * This function retrieves a URL mapping from the database by its identifier.
 */
const getFromDb = withCodec({
	encoder: Schema.String,
	decoder: Schema.UndefinedOr(StudioCMSStorageManagerUrlMappings.Select),
	callbackFn: (query, input) =>
		query((db) =>
			db
				.selectFrom('StudioCMSStorageManagerUrlMappings')
				.where('identifier', '=', input)
				.selectAll()
				.executeTakeFirst()
		),
});

/**
 * Set URL Mapping in Database.
 *
 * This function inserts or updates a URL mapping in the database.
 */
const setToDb = withEncoder({
	encoder: StudioCMSStorageManagerUrlMappings.Insert,
	callbackFn: (query, input) =>
		query((db) =>
			db
				.insertInto('StudioCMSStorageManagerUrlMappings')
				.values(input)
				.onConflict((oc) => oc.column('identifier').doUpdateSet(input))
				.execute()
		),
});

/**
 * Delete URL Mapping from Database.
 *
 * This function deletes a URL mapping from the database by its identifier.
 */
const deleteFromDb = withEncoder({
	encoder: Schema.String,
	callbackFn: (query, input) =>
		query((db) =>
			db.deleteFrom('StudioCMSStorageManagerUrlMappings').where('identifier', '=', input).execute()
		),
});

/**
 * Get All URL Mappings from Database.
 *
 * This function retrieves all URL mappings from the database.
 */
const getAllFromDb = withDecoder({
	decoder: Schema.Array(StudioCMSStorageManagerUrlMappings.Select),
	callbackFn: (query) =>
		query((db) => db.selectFrom('StudioCMSStorageManagerUrlMappings').selectAll().execute()),
});

/**
 * Database implementation for managing URL mappings in the storage system.
 *
 * This class provides CRUD operations for URL mappings, including retrieval,
 * storage, deletion, and automatic cleanup of expired non-permanent URLs.
 *
 * @implements {UrlMappingDatabaseDefinition}
 *
 * @example
 * ```typescript
 * const db = new UrlMappingDatabase();
 * const mapping = await db.get('storage-file://example');
 * ```
 */
export default class UrlMappingDatabase implements UrlMappingDatabaseDefinition {
	async get(identifier: `storage-file://${string}`): Promise<UrlMapping | null> {
		const result = (await runSDK(getFromDb(identifier))) as UrlMapping | undefined;

		return result || null;
	}

	async set(mapping: UrlMapping): Promise<void> {
		await runSDK(
			setToDb({
				...mapping,
				isPermanent: mapping.isPermanent ? 1 : 0,
			})
		);
	}

	async delete(identifier: `storage-file://${string}`): Promise<void> {
		await runSDK(deleteFromDb(identifier));
	}

	async cleanup(): Promise<number> {
		const now = Date.now();
		let deletedCount = 0;

		const allMappings = await this.getAll();

		for (const mapping of allMappings) {
			// Only cleanup non-permanent URLs that have expired
			if (!mapping.isPermanent && mapping.expiresAt && mapping.expiresAt <= now) {
				await runSDK(deleteFromDb(mapping.identifier));
				deletedCount++;
			}
		}

		return deletedCount;
	}

	async getAll(): Promise<UrlMapping[]> {
		return (await runSDK(getAllFromDb())) as UrlMapping[];
	}
}
