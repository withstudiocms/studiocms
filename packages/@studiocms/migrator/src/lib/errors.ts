/**
 * Error case for missing required AstroDB tables in the connected database.
 */
export const AstroDbTableError = {
	title: 'Error: Missing Required AstroDB Tables',
	description:
		'It seems that not all required StudioCMS AstroDB tables were found in your connected database. Please ensure that you have connected to the correct database that contains your previous StudioCMS data.',
};

/**
 * Error case for pending schema migrations in the connected database.
 */
export const PendingSchemaMigrationsError = {
	title: 'Error: Pending Schema Migrations Detected',
	description:
		'Your database has pending schema migrations that need to be applied before proceeding with the migration. Please run the necessary migrations to update your database schema to the latest version before attempting data migration.',
};

/**
 * Error case for data migration not being available due to existing data.
 */
export const DataMigrationNotAvailableError = {
	title: 'Error: Data Migration Not Available',
	description:
		'Data migration cannot proceed because there is existing data in the target database. Please ensure that the target database is empty before attempting to migrate data.',
};

/**
 * Get an array of error cases based on the provided data.
 *
 * @param data - An object containing various status indicators.
 * @returns An array of error case objects.
 */
export const getErrorCases = (data: {
	astroDBTables: string[];
	astroDbTableKeys: string[];
	appliedMigrations: number;
	migrationTotal: number;
	dataMigrationStatus: {
		canMigrate: boolean;
	};
}) => {
	return [
		{
			condition: data.astroDBTables.length < data.astroDbTableKeys.length,
			...AstroDbTableError,
		},
		{
			condition: data.appliedMigrations < data.migrationTotal,
			...PendingSchemaMigrationsError,
		},
		{
			condition: data.dataMigrationStatus.canMigrate === false,
			...DataMigrationNotAvailableError,
		},
	];
};
