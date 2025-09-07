import { log } from '@withstudiocms/effect/clack';
import chalk from 'chalk';
import { runEffect } from '../../effect.js';

export const checkRequiredEnvVars = async (envVars: string[]) => {
	const missingVars: string[] = [];

	for (const varName of envVars) {
		if (!process.env[varName]) {
			missingVars.push(varName);
		}
	}

	if (missingVars.length > 0) {
		await runEffect(
			log.error(
				`${chalk.red.bold('Missing environment variables:')} ${missingVars.map((v) => chalk.red(v)).join(', ')}`
			)
		);
		process.exit(1);
	}
};
