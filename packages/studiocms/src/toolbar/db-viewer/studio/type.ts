import type { ClientConfig } from 'pg';

export interface TursoConfig {
	driver: 'turso';
	connection: {
		url: string;
		token?: string;
		attach?: Record<string, string>;
	};
}

export interface MySqlConfig {
	driver: 'mysql';
	connection: {
		database: string;
		host: string;
		port: number;
		user: string;
		password: string;
	};
}

interface SqliteConfig {
	driver: 'sqlite';
	connection: {
		file: string;
		attach?: Record<string, string>;
	};
}

export interface PostgresConfig {
	driver: 'postgres';
	connection: ClientConfig;
}
export type JsonConnectionConfig = TursoConfig | SqliteConfig | MySqlConfig | PostgresConfig;
