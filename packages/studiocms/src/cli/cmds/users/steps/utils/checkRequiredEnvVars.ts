import type { Context } from '../../../../lib/context.js';

export function checkRequiredEnvVars(ctx: Context, envVars: string[]) {
	for (const varName of envVars) {
		if (!process.env[varName]) {
			ctx.logger.error(`${varName} is a required environment variable when using this utility.`);
			ctx.exit(1);
		}
	}
}
