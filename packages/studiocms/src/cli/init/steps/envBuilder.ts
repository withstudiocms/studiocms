import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import color from 'chalk';
import type { Context } from '../../lib/context.js';
import {
	StudioCMSColorwayError,
	StudioCMSColorwayInfo,
	StudioCMSColorwayWarnBg,
	exists,
	label,
} from '../../lib/utils.js';
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
	ctx: Pick<
		Context,
		'cwd' | 'p' | 'pCancel' | 'pOnCancel' | 'dryRun' | 'tasks' | 'exit' | 'debug' | 'logger'
	>
) {
	ctx.debug && ctx.logger.debug('Running env...');
	let _env = false;
	let envFileContent: string;

	const envExists = exists(path.join(ctx.cwd, '.env'));

	ctx.debug && ctx.logger.debug(`Environment file exists: ${envExists}`);

	if (envExists) {
		ctx.p.log.warn(
			`${label('Warning', StudioCMSColorwayWarnBg, color.black)} An environment file already exists. Would you like to overwrite it?`
		);

		const check = await ctx.p.confirm({
			message: 'Confirm Overwrite',
		});

		if (typeof check === 'symbol') {
			ctx.pCancel(check);
		} else {
			ctx.debug && ctx.logger.debug(`Environment file overwrite selected: ${check}`);
			if (!check) {
				return;
			}
		}
	}

	const EnvPrompt = await ctx.p.select({
		message: 'What kind of environment file would you like to create?',
		options: [
			{ value: 'builder', label: 'Use Interactive .env Builder' },
			{ value: 'example', label: 'Use the Example .env file' },
			{ value: 'none', label: 'Skip Environment File Creation', hint: 'Cancel' },
		],
	});

	if (typeof EnvPrompt === 'symbol') {
		ctx.pCancel(EnvPrompt);
	} else {
		ctx.debug && ctx.logger.debug(`Environment file type selected: ${EnvPrompt}`);

		_env = EnvPrompt !== 'none';
	}

	if (EnvPrompt === 'example') {
		envFileContent = ExampleEnv;
	} else if (EnvPrompt === 'builder') {
		let envBuilderOpts: EnvBuilderOptions = {};

		const envBuilderStep1 = await ctx.p.group(
			{
				astroDbRemoteUrl: () =>
					ctx.p.text({
						message: 'Remote URL for AstroDB',
						initialValue: 'libsql://your-database.turso.io',
					}),
				astroDbToken: () =>
					ctx.p.text({
						message: 'AstroDB Token',
						initialValue: 'your-astrodb-token',
					}),
				encryptionKey: () =>
					ctx.p.text({
						message: 'StudioCMS Auth Encryption Key',
						initialValue: crypto.randomBytes(16).toString('base64'),
					}),
				oAuthOptions: () =>
					ctx.p.multiselect({
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
				onCancel: () => ctx.pOnCancel(),
			}
		);

		ctx.debug && ctx.logger.debug(`Environment Builder Step 1: ${envBuilderStep1}`);

		envBuilderOpts = { ...envBuilderStep1 };

		if (envBuilderStep1.oAuthOptions.includes('github')) {
			const githubOAuth = await ctx.p.group(
				{
					clientId: () =>
						ctx.p.text({
							message: 'GitHub Client ID',
							initialValue: 'your-github-client-id',
						}),
					clientSecret: () =>
						ctx.p.text({
							message: 'GitHub Client Secret',
							initialValue: 'your-github-client-secret',
						}),
					redirectUri: () =>
						ctx.p.text({
							message: 'GitHub Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => ctx.pOnCancel(),
				}
			);

			ctx.debug && ctx.logger.debug(`GitHub OAuth: ${githubOAuth}`);

			envBuilderOpts.githubOAuth = githubOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('discord')) {
			const discordOAuth = await ctx.p.group(
				{
					clientId: () =>
						ctx.p.text({
							message: 'Discord Client ID',
							initialValue: 'your-discord-client-id',
						}),
					clientSecret: () =>
						ctx.p.text({
							message: 'Discord Client Secret',
							initialValue: 'your-discord-client-secret',
						}),
					redirectUri: () =>
						ctx.p.text({
							message: 'Discord Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => ctx.pOnCancel(),
				}
			);

			ctx.debug && ctx.logger.debug(`Discord OAuth: ${discordOAuth}`);

			envBuilderOpts.discordOAuth = discordOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('google')) {
			const googleOAuth = await ctx.p.group(
				{
					clientId: () =>
						ctx.p.text({
							message: 'Google Client ID',
							initialValue: 'your-google-client-id',
						}),
					clientSecret: () =>
						ctx.p.text({
							message: 'Google Client Secret',
							initialValue: 'your-google-client-secret',
						}),
					redirectUri: () =>
						ctx.p.text({
							message: 'Google Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => ctx.pOnCancel(),
				}
			);

			ctx.debug && ctx.logger.debug(`Google OAuth: ${googleOAuth}`);

			envBuilderOpts.googleOAuth = googleOAuth;
		}

		if (envBuilderStep1.oAuthOptions.includes('auth0')) {
			const auth0OAuth = await ctx.p.group(
				{
					clientId: () =>
						ctx.p.text({
							message: 'Auth0 Client ID',
							initialValue: 'your-auth0-client-id',
						}),
					clientSecret: () =>
						ctx.p.text({
							message: 'Auth0 Client Secret',
							initialValue: 'your-auth0-client-secret',
						}),
					domain: () =>
						ctx.p.text({
							message: 'Auth0 Domain',
							initialValue: 'your-auth0-domain',
						}),
					redirectUri: () =>
						ctx.p.text({
							message: 'Auth0 Redirect URI Domain',
							initialValue: 'http://localhost:4321',
						}),
				},
				{
					onCancel: () => ctx.pOnCancel(),
				}
			);

			ctx.debug && ctx.logger.debug(`Auth0 OAuth: ${auth0OAuth}`);

			envBuilderOpts.auth0OAuth = auth0OAuth;
		}

		envFileContent = buildEnvFile(envBuilderOpts);
	}

	if (ctx.dryRun) {
		ctx.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping environment file creation')}`,
			task: async (message) => {
				message('Creating environment file... (skipped)');
			},
		});
	} else if (_env) {
		ctx.tasks.push({
			title: color.dim('Creating environment file...'),
			task: async (message) => {
				try {
					await fs.writeFile(path.join(ctx.cwd, '.env'), envFileContent, {
						encoding: 'utf-8',
					});
					message('Environment file created');
				} catch (e) {
					if (e instanceof Error) {
						ctx.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
						process.exit(1);
					} else {
						ctx.p.log.error(
							StudioCMSColorwayError('Unknown Error: Unable to create environment file.')
						);
						process.exit(1);
					}
				}
			},
		});
	}

	ctx.debug && ctx.logger.debug('Environment complete');
}
