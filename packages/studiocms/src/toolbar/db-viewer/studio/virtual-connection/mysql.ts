import MySQLDriver from '../drivers/mysql.js';
import type { JsonConnectionConfig } from '../type.js';

export function createConnectionFromConfig(_configFile: string, config: JsonConnectionConfig) {
	if (config.driver === 'mysql') {
		return new MySQLDriver(config.connection);
	}
}
