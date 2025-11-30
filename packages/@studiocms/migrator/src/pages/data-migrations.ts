import { db } from 'astro:db';
import type { APIRoute } from 'astro';
import { getStudioCMSDb } from '../db/client.js';
import { remapFunctions } from '../lib/remapUtils.js';
import { jsonResponse } from '../lib/response-utils.js';
import {
	AstroDBTableSchema,
	getMigrationPairs,
	tablesWithNoReferences,
	tablesWithReferences,
} from '../lib/tableMap.js';

const studioCMSDb = await getStudioCMSDb();

export const POST: APIRoute = async () => {
	try {
		// Loop through each table that does not require relationship definitions
		for (const tableName in tablesWithNoReferences) {
			// Get the corresponding AstroDB and Kysely table names
			const { astroTable, kyselyTable } = getMigrationPairs(
				tableName as (typeof tablesWithNoReferences)[number]
			);

			// Fetch all data from the AstroDB table
			const sourceData = await db.select().from(AstroDBTableSchema[astroTable]);

			// Remap the data using the appropriate remap function
			const remappedData = remapFunctions[astroTable as keyof typeof remapFunctions](
				// biome-ignore lint/suspicious/noExplicitAny: dynamic table handling
				sourceData as any
			);

			// Insert the remapped data into the Kysely table
			const insertResult = await studioCMSDb.db
				.insertInto(kyselyTable)
				.values(remappedData)
				.executeTakeFirst();

			// Log the result
			console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} rows into ${kyselyTable}`);
		}
	} catch (error) {
		console.error(`Migration failed with error: ${String(error)}`);
		return jsonResponse({ success: false, error: String(error) }, 500);
	}

	try {
		// Handle tables that require relationship definitions here
		for (const tableName of Object.keys(tablesWithReferences)) {
			// Get the corresponding AstroDB and Kysely table names
			const { astroTable, kyselyTable } = getMigrationPairs(
				tableName as (typeof tablesWithNoReferences)[number]
			);

			// Fetch all data from the AstroDB table
			const sourceData = await db.select().from(AstroDBTableSchema[astroTable]);

			// Remap the data using the appropriate remap function
			const remappedData = remapFunctions[astroTable as keyof typeof remapFunctions](
				// biome-ignore lint/suspicious/noExplicitAny: dynamic table handling
				sourceData as any
			);

			// Insert the remapped data into the Kysely table
			const insertResult = await studioCMSDb.db
				.insertInto(kyselyTable)
				.values(remappedData)
				.executeTakeFirst();

			// Log the result
			console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} rows into ${kyselyTable}`);
		}
	} catch (error) {
		console.error(`Migration failed with error: ${String(error)}`);
		return jsonResponse({ success: false, error: String(error) }, 500);
	}

	return jsonResponse({ success: true });
};
