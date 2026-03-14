import PostgresDriver from '../drivers/postgres.js';
import type { JsonConnectionConfig } from '../type.js';

export function createConnectionFromConfig(_configFile: string, config: JsonConnectionConfig) {
	if (config.driver === 'postgres') {
		return new PostgresDriver(config.connection);
	}
}
