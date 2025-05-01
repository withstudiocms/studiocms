import type { AstroIntegrationLogger } from 'astro';

export function pluginLogger(id: string, logger: AstroIntegrationLogger): AstroIntegrationLogger {
	const newLogger = logger.fork(`plugin:${id}`);
	return newLogger;
}
