import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
	StudioCMSColorwayError,
	StudioCMSColorwayInfo,
	StudioCMSColorwayWarnBg,
	TursoColorway,
} from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import {
	commandExists,
	exists,
	runInteractiveCommand,
	runShellCommand,
} from '@withstudiocms/cli-kit/utils';
import {
	askToContinue,
	confirm,
	group,
	log,
	multiselect,
	select,
	spinner,
	text,
} from '@withstudiocms/effect/clack';
import { Effect, runEffect } from '../../../effect.js';
import { logger } from '../../utils/logger.js';
import { buildEnvFile, type EnvBuilderOptions, ExampleEnv } from '../../utils/studiocmsEnv.js';
import type { EffectStepFn } from '../../utils/types.js';

export enum EnvBuilderAction {
	builder = 'builder',
	example = 'example',
	none = 'none',
}

export const env: EffectStepFn = Effect.fn(function* (context, debug, dryRun) {
	const { chalk, cwd, pCancel, pOnCancel } = context;

	debug && logger.debug('Running env...');

	let _env = false;
	let envFileContent: string;

	const envExists = exists(path.join(cwd, '.env'));

	debug && logger.debug(`Environment file exists: ${envExists}`);

	if (envExists) {
		yield* log.warn(
			`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} An environment file already exists. Would you like to overwrite it?`
		);

		const confirm = yield* askToContinue();

		if (!confirm) {
			return yield* context.exit(0);
		}

		debug && logger.debug('User opted to overwrite existing .env file');
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

	debug && logger.debug(`Environment file type selected: ${envPrompt}`);

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
			let envBuilderOpts: EnvBuilderOptions = {};

			const isWindows = os.platform() === 'win32';

			if (isWindows) {
				runEffect(
					log.warn(
						`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} Turso DB CLI is not supported on Windows outside of WSL.`
					)
				);
			}

			let tursoDB: symbol | 'yes' | 'no' = 'no';

			if (!isWindows) {
				tursoDB = yield* select({
					message: 'Would you like us to setup a new Turso DB for you? (Runs `turso db create`)',
					options: [
						{ value: 'yes', label: 'Yes' },
						{ value: 'no', label: 'No' },
					],
				});
			}

			if (typeof tursoDB === 'symbol') {
				return yield* pCancel(tursoDB);
			}

			if (tursoDB === 'yes') {
				if (!commandExists('turso')) {
					yield* log.error(StudioCMSColorwayError('Turso CLI is not installed.'));

					const installTurso = yield* confirm({
						message: 'Would you like to install Turso CLI now?',
					});

					if (typeof installTurso === 'symbol') {
						return yield* pCancel(installTurso);
					}

					if (installTurso) {
						if (isWindows) {
							yield* log.error(
								StudioCMSColorwayError(
									'Automatic installation is not supported on Windows. Please install Turso CLI manually from https://turso.tech/docs/getting-started/installation'
								)
							);
							return yield* context.exit(1);
						}
						yield* Effect.try({
							try: () =>
								runInteractiveCommand('curl -fsSL https://get.turso.tech/cli.sh | sh', {
									cwd,
									shell: true,
									env: process.env,
								}),
							catch: (cause) => new Error(`Failed to install Turso CLI: ${String(cause)}`),
						});
						yield* log.success('Turso CLI installed successfully.');
					} else {
						yield* log.warn(
							`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} You will need to setup your own AstroDB and provide the URL and Token.`
						);
					}
				}

				const checkLogin = yield* Effect.tryPromise({
					try: () => runShellCommand('turso auth login --headless'),
					catch: (cause) => new Error(`Turso CLI Error: ${String(cause)}`),
				});

				if (
					!checkLogin.includes('Already signed in as') &&
					!checkLogin.includes('Success! Existing JWT still valid')
				) {
					yield* log.message(`Please sign in to Turso to continue.\n${checkLogin}`);

					const loginToken = yield* text({
						message: 'Enter the login token ( the code within the " " )',
						placeholder: 'eyJhb...tnPnw',
					});

					if (typeof loginToken === 'symbol') {
						return yield* pCancel(loginToken);
					}

					const loginResult = yield* Effect.tryPromise({
						try: () => runShellCommand(`turso config set token "${loginToken}"`),
						catch: (cause) => new Error(`Turso CLI Error: ${String(cause)}`),
					});

					if (loginResult.includes('Token set successfully.')) {
						yield* log.success('Successfully logged in to Turso.');
					} else {
						yield* log.error(StudioCMSColorwayError('Unable to login to Turso.'));
						yield* context.exit(1);
					}
				}

				const setCustomDbName = yield* confirm({
					message: 'Would you like to provide a custom name for the database?',
					initialValue: false,
				});

				if (typeof setCustomDbName === 'symbol') {
					return yield* pCancel(setCustomDbName);
				}

				let dbName = `scms_db_${crypto.randomBytes(4).toString('hex')}`;

				if (setCustomDbName) {
					const customDbName = yield* text({
						message: 'Enter a custom name for the database',
						placeholder: 'my_custom_db_name',
					});

					if (typeof customDbName === 'symbol') {
						return yield* pCancel(customDbName);
					}

					dbName = customDbName;
				}

				debug && logger.debug(`New database name: ${dbName}`);

				const tursoSetup = yield* spinner();

				yield* tursoSetup.start(
					`${label('Turso', TursoColorway, chalk.black)} Setting up Turso DB...`
				);

				yield* tursoSetup.message(
					`${label('Turso', TursoColorway, chalk.black)} Creating Database...`
				);

				const createResponse = yield* Effect.tryPromise({
					try: () => runShellCommand(`turso db create ${dbName}`),
					catch: (cause) => new Error(`Turso CLI Error: ${String(cause)}`),
				});

				const dbNameMatch = createResponse.match(/^Created database (\S+) at group/m);

				const dbFinalName = dbNameMatch ? dbNameMatch[1] : undefined;

				yield* tursoSetup.message(
					`${label('Turso', TursoColorway, chalk.black)} Retrieving database information...`
				);

				const showCMD = `turso db show ${dbName}`;
				const tokenCMD = `turso db tokens create ${dbName}`;

				const showResponse = yield* Effect.tryPromise({
					try: () => runShellCommand(showCMD),
					catch: (cause) => new Error(`Turso CLI Error: ${String(cause)}`),
				});

				const urlMatch = showResponse.match(/^URL:\s+(\S+)/m);

				const dbURL = urlMatch ? urlMatch[1] : undefined;

				debug && logger.debug(`Database URL: ${dbURL}`);

				const tokenResponse = yield* Effect.tryPromise({
					try: () => runShellCommand(tokenCMD),
					catch: (cause) => new Error(`Turso CLI Error: ${String(cause)}`),
				});

				const dbToken = tokenResponse.trim();

				debug && logger.debug(`Database Token: ${dbToken}`);

				envBuilderOpts.astroDbRemoteUrl = dbURL;
				envBuilderOpts.astroDbToken = dbToken;

				yield* tursoSetup.stop(
					`${label('Turso', TursoColorway, chalk.black)} Database setup complete. New Database: ${dbFinalName}`
				);

				yield* log.message('Database Token and Url saved to environment file.');
			} else {
				yield* log.warn(
					`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} You will need to setup your own AstroDB and provide the URL and Token.`
				);
				const envBuilderStep_AstroDB = yield* group(
					{
						astroDbRemoteUrl: async () =>
							await runEffect(
								text({
									message: 'Remote URL for AstroDB',
									initialValue: 'libsql://your-database.turso.io',
								})
							),
						astroDbToken: async () =>
							await runEffect(
								text({
									message: 'AstroDB Token',
									initialValue: 'your-astrodb-token',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				debug && logger.debug(`AstroDB setup: ${envBuilderStep_AstroDB}`);

				envBuilderOpts = { ...envBuilderStep_AstroDB };
			}

			const envBuilderStep1 = yield* group(
				{
					encryptionKey: async () =>
						await runEffect(
							text({
								message: 'StudioCMS Auth Encryption Key',
								initialValue: crypto.randomBytes(16).toString('base64'),
							})
						),
					oAuthOptions: async () =>
						await runEffect(
							multiselect({
								message: 'Setup OAuth Providers',
								options: [
									{ value: 'github', label: 'GitHub' },
									{ value: 'discord', label: 'Discord' },
									{ value: 'google', label: 'Google' },
									{ value: 'auth0', label: 'Auth0' },
								],
								required: false,
							})
						),
				},
				{
					// On Cancel callback that wraps the group
					// So if the user cancels one of the prompts in the group this function will be called
					onCancel: async () => await runEffect(pOnCancel()),
				}
			);

			debug && logger.debug(`Environment Builder Step 1: ${envBuilderStep1}`);

			envBuilderOpts = { ...envBuilderStep1 };

			if (envBuilderStep1.oAuthOptions.includes('github')) {
				const githubOAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'GitHub Client ID',
									initialValue: 'your-github-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								text({
									message: 'GitHub Client Secret',
									initialValue: 'your-github-client-secret',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'GitHub Redirect URI Domain',
									initialValue: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				debug && logger.debug(`GitHub OAuth: ${githubOAuth}`);

				envBuilderOpts.githubOAuth = githubOAuth;
			}

			if (envBuilderStep1.oAuthOptions.includes('discord')) {
				const discordOAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'Discord Client ID',
									initialValue: 'your-discord-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								text({
									message: 'Discord Client Secret',
									initialValue: 'your-discord-client-secret',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'Discord Redirect URI Domain',
									initialValue: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				debug && logger.debug(`Discord OAuth: ${discordOAuth}`);

				envBuilderOpts.discordOAuth = discordOAuth;
			}

			if (envBuilderStep1.oAuthOptions.includes('google')) {
				const googleOAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'Google Client ID',
									initialValue: 'your-google-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								text({
									message: 'Google Client Secret',
									initialValue: 'your-google-client-secret',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'Google Redirect URI Domain',
									initialValue: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				debug && logger.debug(`Google OAuth: ${googleOAuth}`);

				envBuilderOpts.googleOAuth = googleOAuth;
			}

			if (envBuilderStep1.oAuthOptions.includes('auth0')) {
				const auth0OAuth = yield* group(
					{
						clientId: async () =>
							await runEffect(
								text({
									message: 'Auth0 Client ID',
									initialValue: 'your-auth0-client-id',
								})
							),
						clientSecret: async () =>
							await runEffect(
								text({
									message: 'Auth0 Client Secret',
									initialValue: 'your-auth0-client-secret',
								})
							),
						domain: async () =>
							await runEffect(
								text({
									message: 'Auth0 Domain',
									initialValue: 'your-auth0-domain',
								})
							),
						redirectUri: async () =>
							await runEffect(
								text({
									message: 'Auth0 Redirect URI Domain',
									initialValue: 'http://localhost:4321',
								})
							),
					},
					{
						onCancel: async () => await runEffect(pOnCancel()),
					}
				);

				debug && logger.debug(`Auth0 OAuth: ${auth0OAuth}`);

				envBuilderOpts.auth0OAuth = auth0OAuth;
			}

			envFileContent = buildEnvFile(envBuilderOpts);

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

	debug && logger.debug('Environment complete');
});
