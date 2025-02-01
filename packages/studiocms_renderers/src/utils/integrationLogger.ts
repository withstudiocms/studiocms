import type { AstroIntegrationLogger } from 'astro';

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
