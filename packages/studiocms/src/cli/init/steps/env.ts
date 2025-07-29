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
import { logger } from '../../utils/logger.js';
import { buildEnvFile, type EnvBuilderOptions, ExampleEnv } from '../../utils/studiocmsEnv.js';
import type { StepFn } from '../../utils/types.js';

export enum EnvBuilderAction {
	builder = 'builder',
	example = 'example',
	none = 'none',
}

export const env: StepFn = async (context, debug, dryRun = false) => {
	const { prompts, chalk, cwd, pCancel, pOnCancel } = context;

	debug && logger.debug('Running env...');

	let _env = false;
	let envFileContent: string;

	const envExists = exists(path.join(cwd, '.env'));

	debug && logger.debug(`Environment file exists: ${envExists}`);

	if (envExists) {
		prompts.log.warn(
			`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} An environment file already exists. Would you like to overwrite it?`
		);

		const check = await prompts.confirm({
			message: 'Confirm Overwrite',
		});

		if (typeof check === 'symbol') {
			pCancel(check);
		} else {
			debug && logger.debug(`Environment file overwrite selected: ${check}`);
			if (!check) {
				return;
			}
		}
	}

	const EnvPrompt = await prompts.select({
		message: 'What kind of environment file would you like to create?',
		options: [
			{ value: EnvBuilderAction.builder, label: 'Use Interactive .env Builder' },
			{ value: EnvBuilderAction.example, label: 'Use the Example .env file' },
			{ value: EnvBuilderAction.none, label: 'Skip Environment File Creation', hint: 'Cancel' },
		],
	});

	if (typeof EnvPrompt === 'symbol') {
		pCancel(EnvPrompt);
	} else {
		debug && logger.debug(`Environment file type selected: ${EnvPrompt}`);

		_env = EnvPrompt !== 'none';
	}

	if (EnvPrompt === EnvBuilderAction.example) {
		envFileContent = ExampleEnv;
	} else if (EnvPrompt === EnvBuilderAction.builder) {
		let envBuilderOpts: EnvBuilderOptions = {};

		const isWindows = os.platform() === 'win32';

		if (isWindows) {
			prompts.log.warn(
				`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} Turso DB CLI is not supported on Windows outside of WSL.`
			);
		}

		let tursoDB: symbol | 'yes' | 'no' = 'no';

		if (!isWindows) {
			tursoDB = await prompts.select({
				message: 'Would you like us to setup a new Turso DB for you? (Runs `turso db create`)',
				options: [
					{ value: 'yes', label: 'Yes' },
					{ value: 'no', label: 'No' },
				],
			});
		}

		if (typeof tursoDB === 'symbol') {
			pCancel(tursoDB);
		} else {
			debug && logger.debug(`AstroDB setup selected: ${tursoDB}`);

			if (tursoDB === 'yes') {
				if (!commandExists('turso')) {
					prompts.log.error(StudioCMSColorwayError('Turso CLI is not installed.'));

					const installTurso = await prompts.confirm({
						message: 'Would you like to install Turso CLI now?',
					});

					if (typeof installTurso === 'symbol') {
						pCancel(installTurso);
					} else {
						if (installTurso) {
							try {
								await runInteractiveCommand('curl -sSfL https://get.tur.so/install.sh | bash');
								console.log('Command completed successfully.');
							} catch (error) {
								console.error(`Failed to run Turso install: ${(error as Error).message}`);
							}
						} else {
							prompts.log.warn(
								`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} You will need to setup your own AstroDB and provide the URL and Token.`
							);
						}
					}
				}

				try {
					const res = await runShellCommand('turso auth login --headless');

					if (
						!res.includes('Already signed in as') &&
						!res.includes('Success! Existing JWT still valid')
					) {
						prompts.log.message(`Please sign in to Turso to continue.\n${res}`);

						const loginToken = await prompts.text({
							message: 'Enter the login token ( the code within the " " )',
							placeholder: 'eyJhb...tnPnw',
						});

						if (typeof loginToken === 'symbol') {
							pCancel(loginToken);
						} else {
							const loginRes = await runShellCommand(`turso config set token "${loginToken}"`);

							if (loginRes.includes('Token set successfully.')) {
								prompts.log.success('Successfully logged in to Turso.');
							} else {
								prompts.log.error(StudioCMSColorwayError('Unable to login to Turso.'));
								process.exit(1);
							}
						}
					}
				} catch (error) {
					if (error instanceof Error) {
						prompts.log.error(StudioCMSColorwayError(`Error: ${error.message}`));
						process.exit(1);
					} else {
						prompts.log.error(StudioCMSColorwayError('Unknown Error: Unable to login to Turso.'));
						process.exit(1);
					}
				}

				const customName = await prompts.confirm({
					message: 'Would you like to provide a custom name for the database?',
					initialValue: false,
				});

				if (typeof customName === 'symbol') {
					pCancel(customName);
				} else {
					const dbName = customName
						? await prompts.text({
								message: 'Enter a custom name for the database',
								initialValue: 'your-database-name',
							})
						: undefined;

					if (typeof dbName === 'symbol') {
						pCancel(dbName);
					} else {
						debug && logger.debug(`Custom database name: ${dbName}`);

						const tursoSetup = prompts.spinner();
						tursoSetup.start(
							`${label('Turso', TursoColorway, chalk.black)} Setting up Turso DB...`
						);
						try {
							tursoSetup.message(
								`${label('Turso', TursoColorway, chalk.black)} Creating Database...`
							);
							const createRes = await runShellCommand(`turso db create ${dbName ? dbName : ''}`);

							const dbNameMatch = createRes.match(/^Created database (\S+) at group/m);

							const dbFinalName = dbNameMatch ? dbNameMatch[1] : undefined;

							tursoSetup.message(
								`${label('Turso', TursoColorway, chalk.black)} Retrieving database information...`
							);
							debug && logger.debug(`Database name: ${dbFinalName}`);

							const showCMD = `turso db show ${dbFinalName}`;
							const tokenCMD = `turso db tokens create ${dbFinalName}`;

							const showRes = await runShellCommand(showCMD);

							const urlMatch = showRes.match(/^URL:\s+(\S+)/m);

							const dbURL = urlMatch ? urlMatch[1] : undefined;

							debug && logger.debug(`Database URL: ${dbURL}`);

							const tokenRes = await runShellCommand(tokenCMD);

							const dbToken = tokenRes.trim();

							debug && logger.debug(`Database Token: ${dbToken}`);

							envBuilderOpts.astroDbRemoteUrl = dbURL;
							envBuilderOpts.astroDbToken = dbToken;

							tursoSetup.stop(
								`${label('Turso', TursoColorway, chalk.black)} Database setup complete. New Database: ${dbFinalName}`
							);
							prompts.log.message('Database Token and Url saved to environment file.');
						} catch (e) {
							tursoSetup.stop();
							if (e instanceof Error) {
								prompts.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								process.exit(1);
							} else {
								prompts.log.error(
									StudioCMSColorwayError('Unknown Error: Unable to create database.')
								);
								process.exit(1);
							}
						}
					}
				}
			} else {
				prompts.log.warn(
					`${label('Warning', StudioCMSColorwayWarnBg, chalk.black)} You will need to setup your own AstroDB and provide the URL and Token.`
				);
				const envBuilderStep_AstroDB = await prompts.group(
					{
						astroDbRemoteUrl: () =>
							prompts.text({
								message: 'Remote URL for AstroDB',
								initialValue: 'libsql://your-database.turso.io',
							}),
						astroDbToken: () =>
							prompts.text({
								message: 'AstroDB Token',
								initialValue: 'your-astrodb-token',
							}),
					},
					{
						onCancel: () => pOnCancel(),
					}
				);

				debug && logger.debug(`AstroDB setup: ${envBuilderStep_AstroDB}`);

				envBuilderOpts = { ...envBuilderStep_AstroDB };
			}
		}

		const envBuilderStep1 = await prompts.group(
			{
				encryptionKey: () =>
					prompts.text({
						message: 'StudioCMS Auth Encryption Key',
						initialValue: crypto.randomBytes(16).toString('base64'),
					}),
				oAuthOptions: () =>
					prompts.multiselect({
						message: 'Setup OAuth Providers',
						options: [
							{ value: 'github', label: 'GitHub' },
							{ value: 'discord', label: 'Discord' },
							{ value: 'google', label: 'Google' },
							{ value: 'auth0', label: 'Auth0' },
						],
						required: false,
					}),
			},
			{
				// On Cancel callback that wraps the group
				// So if the user cancels one of the prompts in the group this function will be called
				onCancel: () => pOnCancel(),
			}
		);

		debug && logger.debug(`Environment Builder Step 1: ${envBuilderStep1}`);

		envBuilderOpts = { ...envBuilderStep1 };

		if (envBuilderStep1.oAuthOptions.includes('github')) {
			const githubOAuth = await prompts.group(
				{
					clientId: () =>
						prompts.text({
							message: 'GitHub Client ID',
							initialValue: 'your-github-client-id',
						}),
					clientSecret: () =>
						prompts.text({
							message: 'GitHub Client Secret',
							initialValue: 'your-github-client-secret',
						}),
					redirectUri: () =>
						prompts.text({
							message: 'GitHub Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => pOnCancel(),
				}
			);

			debug && logger.debug(`GitHub OAuth: ${githubOAuth}`);

			envBuilderOpts.githubOAuth = githubOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('discord')) {
			const discordOAuth = await prompts.group(
				{
					clientId: () =>
						prompts.text({
							message: 'Discord Client ID',
							initialValue: 'your-discord-client-id',
						}),
					clientSecret: () =>
						prompts.text({
							message: 'Discord Client Secret',
							initialValue: 'your-discord-client-secret',
						}),
					redirectUri: () =>
						prompts.text({
							message: 'Discord Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => pOnCancel(),
				}
			);

			debug && logger.debug(`Discord OAuth: ${discordOAuth}`);

			envBuilderOpts.discordOAuth = discordOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('google')) {
			const googleOAuth = await prompts.group(
				{
					clientId: () =>
						prompts.text({
							message: 'Google Client ID',
							initialValue: 'your-google-client-id',
						}),
					clientSecret: () =>
						prompts.text({
							message: 'Google Client Secret',
							initialValue: 'your-google-client-secret',
						}),
					redirectUri: () =>
						prompts.text({
							message: 'Google Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => pOnCancel(),
				}
			);

			debug && logger.debug(`Google OAuth: ${googleOAuth}`);

			envBuilderOpts.googleOAuth = googleOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('auth0')) {
			const auth0OAuth = await prompts.group(
				{
					clientId: () =>
						prompts.text({
							message: 'Auth0 Client ID',
							initialValue: 'your-auth0-client-id',
						}),
					clientSecret: () =>
						prompts.text({
							message: 'Auth0 Client Secret',
							initialValue: 'your-auth0-client-secret',
						}),
					domain: () =>
						prompts.text({
							message: 'Auth0 Domain',
							initialValue: 'your-auth0-domain',
						}),
					redirectUri: () =>
						prompts.text({
							message: 'Auth0 Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => pOnCancel(),
				}
			);

			debug && logger.debug(`Auth0 OAuth: ${auth0OAuth}`);

			envBuilderOpts.auth0OAuth = auth0OAuth;
		}

		envFileContent = buildEnvFile(envBuilderOpts);
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
						prompts.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
						process.exit(1);
					} else {
						prompts.log.error(
							StudioCMSColorwayError('Unknown Error: Unable to create environment file.')
						);
						process.exit(1);
					}
				}
			},
		});
	}

	debug && logger.debug('Environment complete');
};
