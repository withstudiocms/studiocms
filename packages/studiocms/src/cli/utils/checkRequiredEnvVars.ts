import { log } from '@withstudiocms/effect/clack';
import chalk from 'chalk';
import { Effect } from '../../effect.js';

/**
 * Checks for the presence of required environment variables and logs an error if any are missing.
 *
 * Iterates over the provided list of environment variable names, collecting any that are not set
 * in the current process environment. If any required variables are missing, logs an error message
 * listing the missing variables and exits the process with a non-zero status code.
 *
 * @param envVars - An array of environment variable names to check for presence.
 * @yields Logs an error and exits the process if any required environment variables are missing.
 * @returns `void` if all required environment variables are present.
 */
export const checkRequiredEnvVarsEffect = Effect.fn(function* (envVars: string[]) {
	const missingVars: string[] = [];

	yield* Effect.forEach(envVars, (varName) => {
		if (!process.env[varName]) {
			missingVars.push(varName);
		}
		return Effect.succeed(true);
	});

	if (missingVars.length > 0) {
		yield* log.error(
			`${chalk.red.bold('Missing environment variables:')} ${missingVars
				.map((v) => chalk.red(v))
				.join(', ')}`
		);
		return yield* Effect.try(() => process.exit(1));
	}

	return void 0;
});
