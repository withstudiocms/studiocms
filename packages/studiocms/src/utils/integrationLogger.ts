import type { AstroIntegrationLogger } from 'astro';
import type { StudioCMSConfig } from '../schemas/index.js';
import type { Messages } from '../types.js';

export type LoggerOpts = {
	logLevel: 'info' | 'warn' | 'error' | 'debug';
	logger: AstroIntegrationLogger;
	verbose?: boolean;
};

export const integrationLogger = async (opts: LoggerOpts, message: string): Promise<void> => {
	const { logLevel, logger, verbose } = opts;

	switch (verbose) {
		case true:
			logger[logLevel](message);
			break;
		case false:
			if (logLevel !== 'debug' && logLevel !== 'info') {
				logger[logLevel](message);
			}
			break;
		default:
			logger[logLevel](message);
	}
};

export function pluginLogger(id: string, logger: AstroIntegrationLogger): AstroIntegrationLogger {
	const newLogger = logger.fork(`plugin:${id}`);
	return newLogger;
}

export function logMessages(
	messages: Messages,
	options: StudioCMSConfig,
	logger: AstroIntegrationLogger
) {
	// Log messages at the end of the build
	for (const { label, message, logLevel } of messages) {
		integrationLogger(
			{
				logger: logger.fork(label),
				logLevel,
				verbose: logLevel === 'info' ? options.verbose : true,
			},
			message
		);
	}
}
