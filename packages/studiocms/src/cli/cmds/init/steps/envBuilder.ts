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
import type { Context } from '../../../lib/context.js';
import { ExampleEnv, buildEnvFile } from './data/studiocmsEnv.js';

interface GenericOAuth {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

interface Auth0OAuth extends GenericOAuth {
	domain: string;
}

export interface EnvBuilderOptions {
	astroDbRemoteUrl?: string;
	astroDbToken?: string;
	encryptionKey?: string;
	oAuthOptions?: ('github' | 'discord' | 'google' | 'auth0')[];
	githubOAuth?: GenericOAuth;
	discordOAuth?: GenericOAuth;
	googleOAuth?: GenericOAuth;
	auth0OAuth?: Auth0OAuth;
}

export async function env(
	context: Pick<
		Context,
		'cwd' | 'p' | 'pCancel' | 'pOnCancel' | 'dryRun' | 'tasks' | 'exit' | 'debug' | 'logger' | 'c'
	>
) {
	context.debug && context.logger.debug('Running env...');
	let _env = false;
	let envFileContent: string;

	const envExists = exists(path.join(context.cwd, '.env'));

	context.debug && context.logger.debug(`Environment file exists: ${envExists}`);

	if (envExists) {
		context.p.log.warn(
			`${label('Warning', StudioCMSColorwayWarnBg, context.c.black)} An environment file already exists. Would you like to overwrite it?`
		);

		const check = await context.p.confirm({
			message: 'Confirm Overwrite',
		});

		if (typeof check === 'symbol') {
			context.pCancel(check);
		} else {
			context.debug && context.logger.debug(`Environment file overwrite selected: ${check}`);
			if (!check) {
				return;
			}
		}
	}

	const EnvPrompt = await context.p.select({
		message: 'What kind of environment file would you like to create?',
		options: [
			{ value: 'builder', label: 'Use Interactive .env Builder' },
			{ value: 'example', label: 'Use the Example .env file' },
			{ value: 'none', label: 'Skip Environment File Creation', hint: 'Cancel' },
		],
	});

	if (typeof EnvPrompt === 'symbol') {
		context.pCancel(EnvPrompt);
	} else {
		context.debug && context.logger.debug(`Environment file type selected: ${EnvPrompt}`);

		_env = EnvPrompt !== 'none';
	}

	if (EnvPrompt === 'example') {
		envFileContent = ExampleEnv;
	} else if (EnvPrompt === 'builder') {
		let envBuilderOpts: EnvBuilderOptions = {};

		const isWindows = os.platform() === 'win32';

		if (isWindows) {
			context.p.log.warn(
				`${label('Warning', StudioCMSColorwayWarnBg, context.c.black)} Turso DB CLI is not supported on Windows outside of WSL.`
			);
		}

		let tursoDB: symbol | 'yes' | 'no' = 'no';

		if (!isWindows) {
			tursoDB = await context.p.select({
				message: 'Would you like us to setup a new Turso DB for you? (Runs `turso db create`)',
				options: [
					{ value: 'yes', label: 'Yes' },
					{ value: 'no', label: 'No' },
				],
			});
		}

		if (typeof tursoDB === 'symbol') {
			context.pCancel(tursoDB);
		} else {
			context.debug && context.logger.debug(`AstroDB setup selected: ${tursoDB}`);

			if (tursoDB === 'yes') {
				if (!commandExists('turso')) {
					context.p.log.error(StudioCMSColorwayError('Turso CLI is not installed.'));

					const installTurso = await context.p.confirm({
						message: 'Would you like to install Turso CLI now?',
					});

					if (typeof installTurso === 'symbol') {
						context.pCancel(installTurso);
					} else {
						if (installTurso) {
							try {
								await runInteractiveCommand('curl -sSfL https://get.tur.so/install.sh | bash');
								console.log('Command completed successfully.');
							} catch (error) {
								console.error(`Failed to run Turso install: ${(error as Error).message}`);
							}
						} else {
							context.p.log.warn(
								`${label('Warning', StudioCMSColorwayWarnBg, context.c.black)} You will need to setup your own AstroDB and provide the URL and Token.`
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
						context.p.log.message(`Please sign in to Turso to continue.\n${res}`);

						const loginToken = await context.p.text({
							message: 'Enter the login token ( the code within the " " )',
							placeholder: 'eyJhb...tnPnw',
						});

						if (typeof loginToken === 'symbol') {
							context.pCancel(loginToken);
						} else {
							const loginRes = await runShellCommand(`turso config set token "${loginToken}"`);

							if (loginRes.includes('Token set succesfully.')) {
								context.p.log.success('Successfully logged in to Turso.');
							} else {
								context.p.log.error(StudioCMSColorwayError('Unable to login to Turso.'));
								process.exit(1);
							}
						}
					}
				} catch (error) {
					if (error instanceof Error) {
						context.p.log.error(StudioCMSColorwayError(`Error: ${error.message}`));
						process.exit(1);
					} else {
						context.p.log.error(StudioCMSColorwayError('Unknown Error: Unable to login to Turso.'));
						process.exit(1);
					}
				}

				const customName = await context.p.confirm({
					message: 'Would you like to provide a custom name for the database?',
					initialValue: false,
				});

				if (typeof customName === 'symbol') {
					context.pCancel(customName);
				} else {
					const dbName = customName
						? await context.p.text({
								message: 'Enter a custom name for the database',
								initialValue: 'your-database-name',
							})
						: undefined;

					if (typeof dbName === 'symbol') {
						context.pCancel(dbName);
					} else {
						context.debug && context.logger.debug(`Custom database name: ${dbName}`);

						const tursoSetup = context.p.spinner();
						tursoSetup.start(
							`${label('Turso', TursoColorway, context.c.black)} Setting up Turso DB...`
						);
						try {
							tursoSetup.message(
								`${label('Turso', TursoColorway, context.c.black)} Creating Database...`
							);
							const createRes = await runShellCommand(`turso db create ${dbName ? dbName : ''}`);

							const dbNameMatch = createRes.match(/^Created database (\S+) at group/m);

							const dbFinalName = dbNameMatch ? dbNameMatch[1] : undefined;

							tursoSetup.message(
								`${label('Turso', TursoColorway, context.c.black)} Retrieving database information...`
							);
							context.debug && context.logger.debug(`Database name: ${dbFinalName}`);

							const showCMD = `turso db show ${dbFinalName}`;
							const tokenCMD = `turso db tokens create ${dbFinalName}`;

							const showRes = await runShellCommand(showCMD);

							const urlMatch = showRes.match(/^URL:\s+(\S+)/m);

							const dbURL = urlMatch ? urlMatch[1] : undefined;

							context.debug && context.logger.debug(`Database URL: ${dbURL}`);

							const tokenRes = await runShellCommand(tokenCMD);

							const dbToken = tokenRes.trim();

							context.debug && context.logger.debug(`Database Token: ${dbToken}`);

							envBuilderOpts.astroDbRemoteUrl = dbURL;
							envBuilderOpts.astroDbToken = dbToken;

							tursoSetup.stop(
								`${label('Turso', TursoColorway, context.c.black)} Database setup complete. New Database: ${dbFinalName}`
							);
							context.p.log.message('Database Token and Url saved to environment file.');
						} catch (e) {
							tursoSetup.stop();
							if (e instanceof Error) {
								context.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								process.exit(1);
							} else {
								context.p.log.error(
									StudioCMSColorwayError('Unknown Error: Unable to create database.')
								);
								process.exit(1);
							}
						}
					}
				}
			} else {
				context.p.log.warn(
					`${label('Warning', StudioCMSColorwayWarnBg, context.c.black)} You will need to setup your own AstroDB and provide the URL and Token.`
				);
				const envBuilderStep_AstroDB = await context.p.group(
					{
						astroDbRemoteUrl: () =>
							context.p.text({
								message: 'Remote URL for AstroDB',
								initialValue: 'libsql://your-database.turso.io',
							}),
						astroDbToken: () =>
							context.p.text({
								message: 'AstroDB Token',
								initialValue: 'your-astrodb-token',
							}),
					},
					{
						onCancel: () => context.pOnCancel(),
					}
				);

				context.debug && context.logger.debug(`AstroDB setup: ${envBuilderStep_AstroDB}`);

				envBuilderOpts = { ...envBuilderStep_AstroDB };
			}
		}

		const envBuilderStep1 = await context.p.group(
			{
				encryptionKey: () =>
					context.p.text({
						message: 'StudioCMS Auth Encryption Key',
						initialValue: crypto.randomBytes(16).toString('base64'),
					}),
				oAuthOptions: () =>
					context.p.multiselect({
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
				onCancel: () => context.pOnCancel(),
			}
		);

		context.debug && context.logger.debug(`Environment Builder Step 1: ${envBuilderStep1}`);

		envBuilderOpts = { ...envBuilderStep1 };

		if (envBuilderStep1.oAuthOptions.includes('github')) {
			const githubOAuth = await context.p.group(
				{
					clientId: () =>
						context.p.text({
							message: 'GitHub Client ID',
							initialValue: 'your-github-client-id',
						}),
					clientSecret: () =>
						context.p.text({
							message: 'GitHub Client Secret',
							initialValue: 'your-github-client-secret',
						}),
					redirectUri: () =>
						context.p.text({
							message: 'GitHub Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => context.pOnCancel(),
				}
			);

			context.debug && context.logger.debug(`GitHub OAuth: ${githubOAuth}`);

			envBuilderOpts.githubOAuth = githubOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('discord')) {
			const discordOAuth = await context.p.group(
				{
					clientId: () =>
						context.p.text({
							message: 'Discord Client ID',
							initialValue: 'your-discord-client-id',
						}),
					clientSecret: () =>
						context.p.text({
							message: 'Discord Client Secret',
							initialValue: 'your-discord-client-secret',
						}),
					redirectUri: () =>
						context.p.text({
							message: 'Discord Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => context.pOnCancel(),
				}
			);

			context.debug && context.logger.debug(`Discord OAuth: ${discordOAuth}`);

			envBuilderOpts.discordOAuth = discordOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('google')) {
			const googleOAuth = await context.p.group(
				{
					clientId: () =>
						context.p.text({
							message: 'Google Client ID',
							initialValue: 'your-google-client-id',
						}),
					clientSecret: () =>
						context.p.text({
							message: 'Google Client Secret',
							initialValue: 'your-google-client-secret',
						}),
					redirectUri: () =>
						context.p.text({
							message: 'Google Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => context.pOnCancel(),
				}
			);

			context.debug && context.logger.debug(`Google OAuth: ${googleOAuth}`);

			envBuilderOpts.googleOAuth = googleOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('auth0')) {
			const auth0OAuth = await context.p.group(
				{
					clientId: () =>
						context.p.text({
							message: 'Auth0 Client ID',
							initialValue: 'your-auth0-client-id',
						}),
					clientSecret: () =>
						context.p.text({
							message: 'Auth0 Client Secret',
							initialValue: 'your-auth0-client-secret',
						}),
					domain: () =>
						context.p.text({
							message: 'Auth0 Domain',
							initialValue: 'your-auth0-domain',
						}),
					redirectUri: () =>
						context.p.text({
							message: 'Auth0 Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => context.pOnCancel(),
				}
			);

			context.debug && context.logger.debug(`Auth0 OAuth: ${auth0OAuth}`);

			envBuilderOpts.auth0OAuth = auth0OAuth;
		}

		envFileContent = buildEnvFile(envBuilderOpts);
	}

	if (context.dryRun) {
		context.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.c.dim('Skipping environment file creation')}`,
			task: async (message) => {
				message('Creating environment file... (skipped)');
			},
		});
	} else if (_env) {
		context.tasks.push({
			title: context.c.dim('Creating environment file...'),
			task: async (message) => {
				try {
					await fs.writeFile(path.join(context.cwd, '.env'), envFileContent, {
						encoding: 'utf-8',
					});
					message('Environment file created');
				} catch (e) {
					if (e instanceof Error) {
						context.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
						process.exit(1);
					} else {
						context.p.log.error(
							StudioCMSColorwayError('Unknown Error: Unable to create environment file.')
						);
						process.exit(1);
					}
				}
			},
		});
	}

	context.debug && context.logger.debug('Environment complete');
}
