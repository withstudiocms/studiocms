import { db } from 'studiocms:config';

/**
 * Application configuration type.
 */
export type AppConfig = {
	dialect: 'sqlite' | 'postgres' | 'mysql';
};

/**
 * Default application configuration.
 */
export const DEFAULT_CONFIG: AppConfig = {
	dialect: 'sqlite',
};

/**
 * Mapping of supported database dialects to application dialects.
 */
export const dialectMap: Record<string, AppConfig['dialect']> = {
	sqlite: 'sqlite',
	libsql: 'sqlite',
	turso: 'sqlite',
	postgres: 'postgres',
	mysql: 'mysql',
};

/**
 * Retrieves the application configuration based on the database settings.
 *
 * @returns {AppConfig} The application configuration.
 */
export const getConfig = (): AppConfig => {
	if (db?.dialect && dialectMap[db.dialect]) {
		return {
			...DEFAULT_CONFIG,
			dialect: dialectMap[db.dialect],
		};
	}
	return DEFAULT_CONFIG;
};
