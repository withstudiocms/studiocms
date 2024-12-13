import { runtimeLogger } from '@inox-tools/runtime-logger';
import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { DashboardStrings } from '@studiocms/core/strings';
import { addAstroEnvConfig } from '@studiocms/core/utils';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { envField } from 'astro/config';
import copy from 'rollup-plugin-copy';
import { name } from '../package.json';
import { StudioCMSAuthOptionsSchema } from './schema';
import authLibDTS from './stubs/auth-lib';
import authScriptsDTS from './stubs/auth-scripts';
import authUtilsDTS from './stubs/auth-utils';
import { checkEnvKeys } from './utils/checkENV';
import { injectAuthAPIRoutes, injectAuthPageRoutes } from './utils/routeBuilder';

export default defineIntegration({
	name,
	optionsSchema: StudioCMSAuthOptionsSchema,
	setup({
		name,
		options,
		options: {
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
		},
	}) {
		// Create resolver relative to this file
		const { resolve } = createResolver(import.meta.url);

		return {
			hooks: {
				'astro:config:setup': (params) => {
					// Log that Setup is Starting
					integrationLogger(
						{ logger: params.logger, logLevel: 'info', verbose: options.verbose },
						DashboardStrings.Setup
					);

					// Inject `@it-astro:logger:{name}` Logger for runtime logging
					runtimeLogger(params, { name: 'studiocms-auth' });

					// Check for Authentication Environment Variables
					checkEnvKeys(params.logger, options);

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
							'studiocms:auth/lib/encryption': `export * from '${resolve('./lib/encryption.ts')}'`,
							'studiocms:auth/lib/password': `export * from '${resolve('./lib/password.ts')}'`,
							'studiocms:auth/lib/rate-limit': `export * from '${resolve('./lib/rate-limit.ts')}'`,
							'studiocms:auth/lib/session': `export * from '${resolve('./lib/session.ts')}'`,
							'studiocms:auth/lib/types': `export * from '${resolve('./lib/types.ts')}'`,
							'studiocms:auth/lib/user': `export * from '${resolve('./lib/user.ts')}'`,
							'studiocms:auth/utils/authEnvCheck': `export * from '${resolve('./utils/authEnvCheck.ts')}'`,
							'studiocms:auth/utils/validImages': `export * from '${resolve('./utils/validImages.ts')}'`,
							'studiocms:auth/utils/getLabelForPermissionLevel': `export * from '${resolve('./utils/getLabelForPermissionLevel.ts')}'`,
							'studiocms:auth/scripts/three': `import ${JSON.stringify(resolve('./scripts/three.ts'))}`,
							'studiocms:auth/scripts/formListener': `export * from '${resolve('./scripts/formListener.ts')}'`,
						},
					});

					// Update Astro Config
					params.updateConfig({
						security: {
							checkOrigin: true,
						},
						experimental: {
							directRenderScript: true,
							serverIslands: true,
						},
						vite: {
							optimizeDeps: {
								exclude: ['astro:db', 'three'],
							},
							plugins: [
								copy({
									copyOnce: true,
									hook: 'buildStart',
									targets: [
										{
											src: resolve('./resources/*'),
											dest: 'public/studiocms-auth/',
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
								entrypoint: resolve('./routes/api/login.ts'),
								enabled: usernameAndPasswordAPI,
							},
							{
								pattern: 'logout',
								entrypoint: resolve('./routes/api/logout.ts'),
								enabled: dashboardEnabled && !options.dbStartPage,
							},
							{
								pattern: 'register',
								entrypoint: resolve('./routes/api/register.ts'),
								enabled: usernameAndPasswordAPI && allowUserRegistration,
							},
							{
								pattern: 'github',
								entrypoint: resolve('./routes/api/github/index.ts'),
								enabled: githubAPI,
							},
							{
								pattern: 'github/callback',
								entrypoint: resolve('./routes/api/github/callback.ts'),
								enabled: githubAPI,
							},
							{
								pattern: 'discord',
								entrypoint: resolve('./routes/api/discord/index.ts'),
								enabled: discordAPI,
							},
							{
								pattern: 'discord/callback',
								entrypoint: resolve('./routes/api/discord/callback.ts'),
								enabled: discordAPI,
							},
							{
								pattern: 'google',
								entrypoint: resolve('./routes/api/google/index.ts'),
								enabled: googleAPI,
							},
							{
								pattern: 'google/callback',
								entrypoint: resolve('./routes/api/google/callback.ts'),
								enabled: googleAPI,
							},
							{
								pattern: 'auth0',
								entrypoint: resolve('./routes/api/auth0/index.ts'),
								enabled: auth0API,
							},
							{
								pattern: 'auth0/callback',
								entrypoint: resolve('./routes/api/auth0/callback.ts'),
								enabled: auth0API,
							},
						],
					});

					injectAuthPageRoutes(params, {
						options,
						routes: [
							{
								pattern: 'login/',
								entrypoint: resolve('./routes/login.astro'),
								enabled: dashboardEnabled && !options.dbStartPage,
							},
							{
								pattern: 'logout/',
								entrypoint: resolve('./routes/logout.astro'),
								enabled: dashboardEnabled && !options.dbStartPage,
							},
							{
								pattern: 'signup/',
								entrypoint: resolve('./routes/signup.astro'),
								enabled: usernameAndPasswordAPI && allowUserRegistration,
							},
						],
					});
				},
				'astro:config:done': ({ injectTypes }) => {
					// Inject Types
					injectTypes(authLibDTS);
					injectTypes(authUtilsDTS);
					injectTypes(authScriptsDTS);
				},
			},
		};
	},
});
