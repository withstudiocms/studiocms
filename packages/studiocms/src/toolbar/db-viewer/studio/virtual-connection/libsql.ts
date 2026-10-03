import path from 'node:path';
import TursoDriver from '../drivers/sqlite.js';
import type { JsonConnectionConfig } from '../type.js';

export function createConnectionFromConfig(configFile: string, config: JsonConnectionConfig) {
	const configPath = path.dirname(configFile);

	if (config.driver === 'sqlite') {
		return new TursoDriver({
			url: `file:${path.join(configPath, config.connection.file)}`,
			attach: config.connection.attach
				? Object.entries(config.connection.attach).reduce((a, [key, value]) => {
						// @ts-expect-error
						a[key] = path.join(configPath, value);
						return a;
					}, {})
				: undefined,
		});
	}
	if (config.driver === 'turso') {
		return new TursoDriver({
			url: config.connection.url,
			attach: config.connection.attach,
			token: config.connection.token,
		});
	}
}
