export const AstroDbTableError = {
	title: 'Error: Missing Required AstroDB Tables',
	description:
		'It seems that not all required StudioCMS AstroDB tables were found in your connected database. Please ensure that you have connected to the correct database that contains your previous StudioCMS data.',
};

export const PendingSchemaMigrationsError = {
	title: 'Error: Pending Schema Migrations Detected',
	description:
		'Your database has pending schema migrations that need to be applied before proceeding with the migration. Please run the necessary migrations to update your database schema to the latest version before attempting data migration.',
};

export const DataMigrationNotAvailableError = {
	title: 'Error: Data Migration Not Available',
	description:
		'Data migration cannot proceed because there is existing data in the target database. Please ensure that the target database is empty before attempting to migrate data.',
};
