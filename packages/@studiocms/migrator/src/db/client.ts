import { runEffect } from '@withstudiocms/effect';
import { getDBClientLive, type StudioCMSDatabaseSchema } from '@withstudiocms/kysely';
import { sql } from '@withstudiocms/kysely/kysely';
import { getMigratorLive } from '@withstudiocms/kysely/migrator';
import { type KyselyTableKeys, kyselyTableKeys } from '../lib/tableMap';

/**
 * Dynamically import and return the database driver based on the provided dialect.
 *
 * @param dialect - The database dialect as a string.
 * @returns The database driver.
 * @throws Error if the dialect is unsupported.
 */
async function getDialectDriver(dialect: string | undefined) {
	switch (dialect) {
		case 'libsql': {
			const mod = await import('@withstudiocms/kysely/drivers/libsql');
			return await runEffect(mod.libsqlDriver);
		}
		case 'postgres': {
			const mod = await import('@withstudiocms/kysely/drivers/postgres');
			return await runEffect(mod.postgresDriver);
		}
		case 'mysql': {
			const mod = await import('@withstudiocms/kysely/drivers/mysql');
			return await runEffect(mod.mysqlDriver);
		}
		default:
			throw new Error(`Unsupported STUDIOCMS_DIALECT: ${dialect}`);
	}
}

/**
 * Get a StudioCMS database client based on the STUDIOCMS_DIALECT environment variable.
 *
 * @returns The StudioCMS database client.
 * @throws Error if the STUDIOCMS_DIALECT environment variable is not set or unsupported.
 */
export const getStudioCMSDb = async () => {
	const dialect = process.env.STUDIOCMS_DIALECT;
	if (!dialect) {
		throw new Error('STUDIOCMS_DIALECT environment variable is not set.');
	}

	const driver = await getDialectDriver(dialect);
	return await runEffect(getDBClientLive<StudioCMSDatabaseSchema>(driver));
};

/**
 * Get a StudioCMS database migrator based on the STUDIOCMS_DIALECT environment variable.
 *
 * @returns The StudioCMS database migrator.
 * @throws Error if the STUDIOCMS_DIALECT environment variable is not set or unsupported.
 */
export const studioCMSDbMigrator = async () => {
	const dialect = process.env.STUDIOCMS_DIALECT;
	if (!dialect) {
		throw new Error('STUDIOCMS_DIALECT environment variable is not set.');
	}

	const driver = await getDialectDriver(dialect);
	return await runEffect(getMigratorLive(driver));
};

/**
 * Run a connection test to the StudioCMS database.
 *
 * @returns Boolean indicating if the connection test was successful.
 */
export const runConnectionTest = async () => {
	const { db } = await getStudioCMSDb();
	try {
		await db.executeQuery(sql`SELECT CURRENT_TIME;`.compile(db));
		return true;
	} catch (_e) {
		return false;
	}
};

/**
 * Map of supported database dialects to their display names.
 */
const dialectMap = {
	libsql: 'LibSQL',
	mysql: 'MySQL',
	postgres: 'PostgreSQL',
};

/**
 * Get the database dialect from the environment variable.
 *
 * @returns The display name of the database dialect.
 */
export const getDialectFromEnv = () => {
	return dialectMap[process.env.STUDIOCMS_DIALECT as keyof typeof dialectMap] || 'Unknown';
};

/**
 * Get the number of rows in a specified table.
 *
 * @param table - The name of the table.
 * @returns The number of rows in the table.
 */
export const getTableLength = async (table: KyselyTableKeys) => {
	const { db } = await getStudioCMSDb();
	const result = await db.selectFrom(table).select(sql`COUNT(*)`.as('count')).executeTakeFirst();

	if (!result) {
		return 0;
	}

	return Number(result.count);
};

/**
 * Check the data migration status by verifying if any tables contain rows.
 *
 * @returns An object indicating whether migration can proceed.
 */
export const getDataMigrationStatus = async () => {
	const tablesWithRows: string[] = [];

	for (const table of kyselyTableKeys) {
		const result = await getTableLength(table).catch(() => 0);
		if (result > 0) {
			tablesWithRows.push(table);
		}
	}

	if (tablesWithRows.length > 0) {
		return {
			canMigrate: false,
		};
	}

	return {
		canMigrate: true,
	};
};
