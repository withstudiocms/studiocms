import { runEffect } from '@withstudiocms/effect';
import { getDBClientLive, type StudioCMSDatabaseSchema } from '@withstudiocms/kysely';
import { getMigratorLive } from '@withstudiocms/kysely/migrator';

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
