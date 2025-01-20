import { runtimeLogger } from '@inox-tools/runtime-logger';
import { makePublicRoute } from '@studiocms/core/lib';
import { addAstroEnvConfig } from '@studiocms/core/utils';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import { envField } from 'astro/config';
import copy from 'rollup-plugin-copy';
import type { StudioCMSAuthOptions } from '../schema.js';
import { checkEnvKeys } from '../utils/checkENV.js';
import { integrationLogger } from '../utils/integrationLogger.js';
import { injectAuthAPIRoutes, injectAuthPageRoutes } from '../utils/routeBuilder.js';

export const configSetup = defineUtility('astro:config:setup')(
	(params, name: string, options: StudioCMSAuthOptions, prerenderRoutes: boolean) => {
		// Destructure Params
		const { logger, updateConfig } = params;

		// Destructure Options
		const {
			verbose,
			dashboardConfig: {
				dashboardEnabled,
				AuthConfig: {
					providers: {
						github: githubAPI,
						discord: discordAPI,
						google: googleAPI,
						auth0: auth0API,
						usernameAndPassword: usernameAndPasswordAPI,
						usernameAndPasswordConfig: { allowUserRegistration },
					},
				},
			},
		} = options;

		// Create resolver relative to this file
		const { resolve } = createResolver(import.meta.url);

		// Log that Setup is Starting
		integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS Auth...');

		// Inject `@it-astro:logger:{name}` Logger for runtime logging
		runtimeLogger(params, { name: 'studiocms-auth' });

		// Check for Authentication Environment Variables
		checkEnvKeys(logger, options);

		// Update Astro Config with Environment Variables (`astro:env`)
		addAstroEnvConfig(params, {
			validateSecrets: true,
			schema: {
				// Auth Encryption Key
				CMS_ENCRYPTION_KEY: envField.string({
					context: 'server',
					access: 'secret',
					optional: false,
				}),
				// GitHub Auth Provider Environment Variables
				CMS_GITHUB_CLIENT_ID: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_GITHUB_CLIENT_SECRET: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_GITHUB_REDIRECT_URI: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				// Discord Auth Provider Environment Variables
				CMS_DISCORD_CLIENT_ID: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_DISCORD_CLIENT_SECRET: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_DISCORD_REDIRECT_URI: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				// Google Auth Provider Environment Variables
				CMS_GOOGLE_CLIENT_ID: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_GOOGLE_CLIENT_SECRET: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_GOOGLE_REDIRECT_URI: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				// Auth0 Auth Provider Environment Variables
				CMS_AUTH0_CLIENT_ID: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_AUTH0_CLIENT_SECRET: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_AUTH0_DOMAIN: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
				CMS_AUTH0_REDIRECT_URI: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
			},
		});

		// injectAuthHelper
		addVirtualImports(params, {
			name,
			imports: {
				'studiocms:auth/lib/encryption': `export * from '${resolve('../lib/encryption.js')}'`,
				'studiocms:auth/lib/password': `export * from '${resolve('../lib/password.js')}'`,
				'studiocms:auth/lib/rate-limit': `export * from '${resolve('../lib/rate-limit.js')}'`,
				'studiocms:auth/lib/session': `export * from '${resolve('../lib/session.js')}'`,
				'studiocms:auth/lib/types': `export * from '${resolve('../lib/types.js')}'`,
				'studiocms:auth/lib/user': `export * from '${resolve('../lib/user.js')}'`,
				'studiocms:auth/utils/authEnvCheck': `export * from '${resolve('../utils/authEnvCheck.js')}'`,
				'studiocms:auth/utils/validImages': `export * from '${resolve('../utils/validImages.js')}'`,
				'studiocms:auth/utils/getLabelForPermissionLevel': `export * from '${resolve('../utils/getLabelForPermissionLevel.js')}'`,
				'studiocms:auth/scripts/three': `import ${JSON.stringify(resolve('../scripts/three.js'))}`,
			},
		});

		integrationLogger({ logger, logLevel: 'info', verbose }, 'Updating user Astro config...');

		// Update Astro Config
		updateConfig({
			vite: {
				optimizeDeps: {
					exclude: ['three'],
				},
				plugins: [
					copy({
						copyOnce: true,
						hook: 'buildStart',
						targets: [
							{
								src: resolve('../../assets/public/*'),
								dest: makePublicRoute('auth'),
							},
						],
					}),
				],
			},
		});

		// Inject API Routes
		injectAuthAPIRoutes(params, {
			options,
			routes: [
				{
					pattern: 'login',
					entrypoint: resolve('../../assets/routes/api/login.ts'),
					enabled: usernameAndPasswordAPI,
				},
				{
					pattern: 'logout',
					entrypoint: resolve('../../assets/routes/api/logout.ts'),
					enabled: dashboardEnabled && !options.dbStartPage,
				},
				{
					pattern: 'register',
					entrypoint: resolve('../../assets/routes/api/register.ts'),
					enabled: usernameAndPasswordAPI && allowUserRegistration,
				},
				{
					pattern: 'github',
					entrypoint: resolve('../../assets/routes/api/github/index.ts'),
					enabled: githubAPI,
				},
				{
					pattern: 'github/callback',
					entrypoint: resolve('../../assets/routes/api/github/callback.ts'),
					enabled: githubAPI,
				},
				{
					pattern: 'discord',
					entrypoint: resolve('../../assets/routes/api/discord/index.ts'),
					enabled: discordAPI,
				},
				{
					pattern: 'discord/callback',
					entrypoint: resolve('../../assets/routes/api/discord/callback.ts'),
					enabled: discordAPI,
				},
				{
					pattern: 'google',
					entrypoint: resolve('../../assets/routes/api/google/index.ts'),
					enabled: googleAPI,
				},
				{
					pattern: 'google/callback',
					entrypoint: resolve('../../assets/routes/api/google/callback.ts'),
					enabled: googleAPI,
				},
				{
					pattern: 'auth0',
					entrypoint: resolve('../../assets/routes/api/auth0/index.ts'),
					enabled: auth0API,
				},
				{
					pattern: 'auth0/callback',
					entrypoint: resolve('../../assets/routes/api/auth0/callback.ts'),
					enabled: auth0API,
				},
			],
		});

		injectAuthPageRoutes(
			params,
			{
				options,
				routes: [
					{
						pattern: 'login/',
						entrypoint: resolve('../../assets/routes/login.astro'),
						enabled: dashboardEnabled && !options.dbStartPage,
					},
					{
						pattern: 'logout/',
						entrypoint: resolve('../../assets/routes/logout.astro'),
						enabled: dashboardEnabled && !options.dbStartPage,
					},
					{
						pattern: 'signup/',
						entrypoint: resolve('../../assets/routes/signup.astro'),
						enabled: usernameAndPasswordAPI && allowUserRegistration,
					},
				],
			},
			prerenderRoutes
		);
	}
);

export default configSetup;
