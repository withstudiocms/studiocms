import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
	StudioCMSColorwayError,
	StudioCMSColorwayInfo,
	StudioCMSColorwayWarnBg,
} from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { exists } from '@withstudiocms/cli-kit/utils';
import {
	askToContinue,
	confirm,
	group,
	log,
	multiselect,
	password,
	select,
	text,
} from '@withstudiocms/effect/clack';
import { Effect, runEffect } from '../../../effect.js';
import { buildDebugLogger } from '../../utils/logger.js';
import { buildEnvFile, type EnvBuilderOptions, ExampleEnv } from '../../utils/studiocmsEnv.js';
import type { EffectStepFn } from '../../utils/types.js';

export enum EnvBuilderAction {
	builder = 'builder',
	example = 'example',
	none = 'none',
}

function emptyStringToUndefined(value: string): string | undefined {
	return value.trim() === '' ? undefined : value.trim();
}

function NumberStringToUndefined(value: string): number | undefined {
	const num = Number(value);
	return Number.isNaN(num) ? undefined : num;
}

export const env: EffectStepFn = Effect.fn(function* (context, debug, dryRun) {
	const { chalk, cwd, pCancel, pOnCancel } = context;

	const debugLogger = yield* buildDebugLogger(debug);

	yield* debugLogger('Running env...');

	let _env = false;
	let envFileContent: string;

	const envExists = exists(path.join(cwd, '.env'));

	yield* debugLogger(`Environment file exists: ${envExists}`);

	if (envExists) {
		yield* log.warn(
			`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} An environment file already exists. Would you like to overwrite it?`
		);

		const confirm = yield* askToContinue();

		if (!confirm) {
			return yield* context.exit(0);
		}

		yield* debugLogger('User opted to overwrite existing .env file');
	}

	const envPrompt = yield* select({
		message: 'What kind of environment file would you like to create?',
		options: [
			{ value: EnvBuilderAction.builder, label: 'Use Interactive .env Builder' },
			{ value: EnvBuilderAction.example, label: 'Use the Example .env file' },
			{ value: EnvBuilderAction.none, label: 'Skip Environment File Creation', hint: 'Cancel' },
		],
	});

	if (typeof envPrompt === 'symbol') {
		return yield* pCancel(envPrompt);
	}

	yield* debugLogger(`Environment file type selected: ${envPrompt}`);

	_env = envPrompt !== 'none';

	switch (envPrompt) {
		case EnvBuilderAction.none: {
			break;
		}
		case EnvBuilderAction.example: {
			envFileContent = ExampleEnv;
			break;
		}
		case EnvBuilderAction.builder: {
			const envBuilderOpts: EnvBuilderOptions = {};

			// step1 - Choose dialect
			const dialect = yield* select({
				message: 'Select your database dialect:',
				options: [
					{ value: 'libsql', label: 'libSQL (Turso)' },
					{ value: 'mysql', label: 'MySQL' },
					{ value: 'postgres', label: 'PostgreSQL' },
				],
			});

			if (typeof dialect === 'symbol') {
				return yield* pCancel(dialect);
			}

			yield* debugLogger(`Database dialect selected: ${dialect}`);

			// step2 - Gather dialect specific config
			let dbConfig: EnvBuilderOptions['dbConfig'];

			switch (dialect) {
				case 'libsql': {
					const rawConfig = yield* group(
						{
							url: async () =>
								await runEffect(
									text({
										message:
											'Enter your libSQL database URL (e.g., libsql://your-database.turso.io or file:./path/to/your/database.db):',
										placeholder: 'libsql://your-database.turso.io',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database URL is required';
											}
										},
									})
								),
							authToken: async () =>
								await runEffect(
									password({
										message: 'Enter your libSQL auth token (leave blank if not applicable):',
									})
								),
							syncInterval: async () =>
								await runEffect(
									text({
										message:
											'Enter your libSQL sync interval in seconds (leave blank if not applicable):',
										placeholder: '',
									})
								),
							syncUrl: async () =>
								await runEffect(
									text({
										message: 'Enter your libSQL sync URL (leave blank if not applicable):',
										placeholder: '',
									})
								),
						},
						{
							onCancel: async () => await runEffect(pOnCancel()),
						}
					);

					dbConfig = {
						dialect: 'libsql',
						url: rawConfig.url,
						authToken: emptyStringToUndefined(rawConfig.authToken),
						syncInterval: NumberStringToUndefined(rawConfig.syncInterval),
						syncUrl: emptyStringToUndefined(rawConfig.syncUrl),
					};

					break;
				}
				case 'mysql': {
					const rawConfig = yield* group(
						{
							database: async () =>
								await runEffect(
									text({
										message: 'Enter your MySQL database name:',
										placeholder: 'my_database',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database name is required';
											}
										},
									})
								),
							user: async () =>
								await runEffect(
									text({
										message: 'Enter your MySQL user:',
										placeholder: 'root',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database user is required';
											}
										},
									})
								),
							password: async () =>
								await runEffect(
									password({
										message: 'Enter your MySQL password:',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database password is required';
											}
										},
									})
								),
							host: async () =>
								await runEffect(
									text({
										message: 'Enter your MySQL host:',
										placeholder: 'localhost',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database host is required';
											}
										},
									})
								),
							port: async () =>
								await runEffect(
									text({
										message: 'Enter your MySQL port:',
										placeholder: '3306',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database port is required';
											}
										},
									})
								),
						},
						{
							onCancel: async () => await runEffect(pOnCancel()),
						}
					);

					dbConfig = {
						dialect: 'mysql',
						database: rawConfig.database,
						user: rawConfig.user,
						password: rawConfig.password,
						host: rawConfig.host,
						port: NumberStringToUndefined(rawConfig.port) ?? 3306,
					};
					break;
				}
				case 'postgres': {
					const rawConfig = yield* group(
						{
							database: async () =>
								await runEffect(
									text({
										message: 'Enter your PostgreSQL database name:',
										placeholder: 'my_database',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database name is required';
											}
										},
									})
								),
							user: async () =>
								await runEffect(
									text({
										message: 'Enter your PostgreSQL user:',
										placeholder: 'postgres',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database user is required';
											}
										},
									})
								),
							password: async () =>
								await runEffect(
									password({
										message: 'Enter your PostgreSQL password:',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database password is required';
											}
										},
									})
								),
							host: async () =>
								await runEffect(
									text({
										message: 'Enter your PostgreSQL host:',
										placeholder: 'localhost',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database host is required';
											}
										},
									})
								),
							port: async () =>
								await runEffect(
									text({
										message: 'Enter your PostgreSQL port:',
										placeholder: '5432',
										validate: (value) => {
											if (!value || value.trim() === '') {
												return 'Database port is required';
											}
										},
									})
								),
						},
						{
							onCancel: async () => await runEffect(pOnCancel()),
						}
					);

					dbConfig = {
						dialect: 'postgres',
						database: rawConfig.database,
						user: rawConfig.user,
						password: rawConfig.password,
						host: rawConfig.host,
						port: NumberStringToUndefined(rawConfig.port) ?? 5432,
					};
					break;
				}
			}

			envBuilderOpts.dbConfig = dbConfig;

			yield* debugLogger(`Database configuration collected: dialect=${dbConfig?.dialect}`);

			// step3 - Get Encryption Key
			const encryptionKey = yield* text({
				message: 'Enter an encryption key for authentication (leave blank to generate one):',
				placeholder: '',
			});

			if (typeof encryptionKey === 'symbol') {
				return yield* pCancel(encryptionKey);
			}

			envBuilderOpts.encryptionKey =
				encryptionKey.trim() === ''
					? crypto.randomBytes(16).toString('base64')
					: encryptionKey.trim();

			yield* debugLogger('Encryption key collected');

			// step4 - OAuth Providers (optional)
			const addOAuth = yield* confirm({
				message: 'Would you like to configure OAuth providers now?',
				initialValue: false,
			});

			if (typeof addOAuth === 'symbol') {
				return yield* pCancel(addOAuth);
			}

			if (addOAuth) {
				const oAuthProviders = yield* multiselect({
					message: 'Select OAuth providers to configure:',
					options: [
						{ value: 'github', label: 'GitHub' },
						{ value: 'discord', label: 'Discord' },
						{ value: 'google', label: 'Google' },
						{ value: 'auth0', label: 'Auth0' },
					],
				});

				if (typeof oAuthProviders === 'symbol') {
					return yield* pCancel(oAuthProviders);
				}

				yield* debugLogger(`OAuth providers selected: ${oAuthProviders.join(', ')}`);

				envBuilderOpts.oAuthOptions = oAuthProviders;
			}

			// step4.1 - For each selected provider, gather config

			if (envBuilderOpts.oAuthOptions?.includes('github')) {
				const githubOAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'GitHub Client ID',
									placeholder: 'your-github-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								password({
									message: 'GitHub Client Secret',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'GitHub Redirect URI Domain',
									placeholder: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				yield* debugLogger('GitHub OAuth configured');

				envBuilderOpts.githubOAuth = githubOAuth;
			}

			if (envBuilderOpts.oAuthOptions?.includes('discord')) {
				const discordOAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'Discord Client ID',
									placeholder: 'your-discord-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								password({
									message: 'Discord Client Secret',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'Discord Redirect URI Domain',
									placeholder: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				yield* debugLogger('Discord OAuth configured');

				envBuilderOpts.discordOAuth = discordOAuth;
			}

			if (envBuilderOpts.oAuthOptions?.includes('google')) {
				const googleOAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'Google Client ID',
									placeholder: 'your-google-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								password({
									message: 'Google Client Secret',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'Google Redirect URI Domain',
									placeholder: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				yield* debugLogger('Google OAuth configured');

				envBuilderOpts.googleOAuth = googleOAuth;
			}

			if (envBuilderOpts.oAuthOptions?.includes('auth0')) {
				const auth0OAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'Auth0 Client ID',
									placeholder: 'your-auth0-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								password({
									message: 'Auth0 Client Secret',
								})
							),
						domain: async () =>
							await runEffect(
								text({
									message: 'Auth0 Domain',
									placeholder: 'your-auth0-domain',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'Auth0 Redirect URI Domain',
									placeholder: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				yield* debugLogger('Auth0 OAuth configured');

				envBuilderOpts.auth0OAuth = auth0OAuth;
			}

			// step5 - Build env file
			envFileContent = buildEnvFile(envBuilderOpts);

			yield* debugLogger('Environment file content built');

			break;
		}
	}

	if (dryRun) {
		context.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${chalk.dim('Skipping environment file creation')}`,
			task: async (message) => {
				message('Creating environment file... (skipped)');
			},
		});
	} else if (_env) {
		context.tasks.push({
			title: chalk.dim('Creating environment file...'),
			task: async (message) => {
				try {
					await fs.writeFile(path.join(cwd, '.env'), envFileContent, {
						encoding: 'utf-8',
					});
					message('Environment file created');
				} catch (e) {
					if (e instanceof Error) {
						await runEffect(log.error(StudioCMSColorwayError(`Error: ${e.message}`)));
						process.exit(1);
					} else {
						await runEffect(
							log.error(StudioCMSColorwayError('Unknown Error: Unable to create environment file.'))
						);
						process.exit(1);
					}
				}
			},
		});
	}

	yield* debugLogger('Environment complete');
});
