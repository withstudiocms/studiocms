import type { Context } from '../../../../lib/context.js';

export function checkRequiredEnvVars(context: Context, envVars: string[]) {
	for (const varName of envVars) {
		if (!process.env[varName]) {
			context.logger.error(
				`${varName} is a required environment variable when using this utility.`
			);
			context.exit(1);
		}
	}
}
