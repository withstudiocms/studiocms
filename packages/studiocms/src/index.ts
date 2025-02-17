/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS integration in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="@astrojs/db" />

import sitemap from '@astrojs/sitemap';
import inlineModPlugin, { defineModule } from '@inox-tools/inline-mod/vite';
import ui from '@studiocms/ui';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { envField } from 'astro/config';
import { z } from 'astro/zod';
import boxen from 'boxen';
import packageJson from 'package-json';
import copy from 'rollup-plugin-copy';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import type { CurrentRESTAPIVersions } from './consts.js';
import { StudioCMSError } from './errors.js';
import { makeAPIRoute, removeLeadingTrailingSlashes } from './lib/index.js';
import { shared } from './lib/renderer/shared.js';
import robotsTXT from './lib/robots/index.js';
import type { SafePluginListType, StudioCMSConfig, StudioCMSOptions } from './schemas/index.js';
import { getInjectedTypes } from './stubs/index.js';
import type { Messages } from './types.js';
import { injectDashboardAPIRoutes } from './utils/addAPIRoutes.js';
import { addIntegrationArray } from './utils/addIntegrationArray.js';
import { checkAstroConfig } from './utils/astroConfigCheck.js';
import { addAstroEnvConfig } from './utils/astroEnvConfig.js';
import { changelogHelper } from './utils/changelog.js';
import { checkEnvKeys } from './utils/checkENV.js';
import { checkForWebVitals } from './utils/checkForWebVitalsPlugin.js';
import { watchStudioCMSConfig } from './utils/configManager.js';
import { configResolver } from './utils/configResolver.js';
import { injectDashboardRoute } from './utils/injectRouteArray.js';
import { integrationLogger } from './utils/integrationLogger.js';
import { nodeNamespaceBuiltinsAstro } from './utils/integrations.js';
import { readJson } from './utils/readJson.js';
import { injectAuthAPIRoutes, injectAuthPageRoutes } from './utils/routeBuilder.js';
import { convertToSafeString } from './utils/safeString.js';

// Resolver Function
const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { name: pkgName, version: pkgVersion } = readJson<{ name: string; version: string }>(
	resolve('../package.json')
);

// Load Environment Variables
const env = loadEnv('', process.cwd(), '');

// SDK Route Resolver
const sdkRouteResolver = makeAPIRoute('sdk');
// API Route Resolver
const apiRoute = makeAPIRoute('renderer');
// REST API Route Resolver
const restRoute = (version: CurrentRESTAPIVersions) => makeAPIRoute(`rest/${version}`);
// V1 REST API Route Resolver
const v1RestRoute = restRoute('v1');

// REST API Directory Resolver
const _rest_dir = (version: CurrentRESTAPIVersions) => (file: string) =>
	resolve(`./routes/rest/${version}/${file}`);

// Routes Directory Resolvers
const routesDir = {
	fts: (file: string) => resolve(`./routes/firstTimeSetupRoutes/${file}`),
	route: (file: string) => resolve(`./routes/dashboard/${file}`),
	api: (file: string) => resolve(`./routes/dashboard/studiocms_api/dashboard/${file}`),
	f0f: (file: string) => resolve(`./routes/${file}`),
	v1Rest: (file: string) => _rest_dir('v1')(file),
};

// Renderer Component Resolver
const RendererComponent = resolve('./components/Renderer.astro');

// Default Editor Component Resolver
const defaultEditorComponent = resolve('./components/DefaultEditor.astro');

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see The [GitHub Repo: `withstudiocms/studiocms`](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
export default defineIntegration({
	name: pkgName,
	optionsSchema: z.custom<StudioCMSOptions>(),
	setup: ({ name, options: opts }) => {
		// Resolved Options for StudioCMS
		let options: StudioCMSConfig;

		// Messages Array for Logging
		const messages: Messages = [];

		// Component Registry for Custom user Components
		let ComponentRegistry: Record<string, string>;

		// Define the resolved Callout Theme
		let resolvedCalloutTheme: string;

		// Define the Image Component Path
		let imageComponentPath: string;

		// Return the Integration
		return {
			name,
			hooks: {
				// DB Setup: Setup the Database Connection for AstroDB and StudioCMS
				'astro:db:setup': ({ extendDb }) => {
					extendDb({ configEntrypoint: resolve('./db/config.js') });
				},
				'astro:config:setup': async (params) => {
					// Destructure the params
					const { logger, config, updateConfig, injectRoute, injectScript } = params;

					logger.info('Checking configuration...');

					// Watch the StudioCMS Config File
					watchStudioCMSConfig(params);

					// Resolve the StudioCMS Configuration
					options = await configResolver(params, opts);

					const {
						verbose,
						rendererConfig,
						includedIntegrations,
						imageService,
						plugins,
						componentRegistry,
						overrides,
						dbStartPage,
						dashboardConfig,
					} = options;

					const {
						dashboardEnabled,
						dashboardRouteOverride,
						inject404Route,
						AuthConfig: {
							enabled: authEnabled,
							providers: {
								github: githubAPI,
								discord: discordAPI,
								google: googleAPI,
								auth0: auth0API,
								usernameAndPassword: usernameAndPasswordAPI,
								usernameAndPasswordConfig: { allowUserRegistration },
							},
						},
					} = dashboardConfig;

					const shouldInject404Route = inject404Route && dashboardEnabled;

					// Create logInfo object
					const logInfo = { logger, logLevel: 'info' as const, verbose };

					// Check for Component Registry
					if (componentRegistry) ComponentRegistry = componentRegistry;

					// Resolve the callout theme based on the user's configuration
					resolvedCalloutTheme = resolve(
						`./styles/md-remark-callouts/${rendererConfig.studiocms.callouts.theme}.css`
					);

					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS...');

					// Check Astro Config for required settings
					checkAstroConfig(params);

					const { resolve: astroConfigResolve } = createResolver(config.root.pathname);

					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS internals...');

					// Add Astro Environment Configuration
					addAstroEnvConfig(params, {
						validateSecrets: true,
						schema: {
							CMS_CLOUDINARY_CLOUDNAME: envField.string({
								context: 'server',
								access: 'secret',
								optional: true,
							}),
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

					// Check for Cloudinary CDN Plugin
					if (imageService.cdnPlugin === 'cloudinary-js') {
						if (!env.CMS_CLOUDINARY_CLOUDNAME) {
							integrationLogger(
								{ logger, logLevel: 'warn', verbose: true },
								'Using the Cloudinary CDN JS SDK Plugin requires the CMS_CLOUDINARY_CLOUDNAME environment variable to be set. Please add this to your .env file.'
							);
						}
					}

					integrationLogger(logInfo, 'Configuring CustomImage Component...');

					// Resolve the Custom Image Component Path
					imageComponentPath = overrides.CustomImageOverride
						? astroConfigResolve(overrides.CustomImageOverride)
						: resolve('./components/image/CustomImage.astro');

					// Log that Setup is Starting
					integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS Auth...');

					// Check for Authentication Environment Variables
					checkEnvKeys(logger, options);

					integrationLogger(logInfo, 'Injecting SDK Routes...');

					injectRoute({
						pattern: sdkRouteResolver('list-pages'),
						entrypoint: resolve('./routes/sdk/list-pages.js'),
						prerender: false,
					});

					injectRoute({
						pattern: sdkRouteResolver('update-latest-version-cache'),
						entrypoint: resolve('./routes/sdk/update-latest-version-cache.js'),
						prerender: false,
					});

					injectRoute({
						pattern: sdkRouteResolver('fallback-list-pages.json'),
						entrypoint: resolve('./routes/sdk/fallback-list-pages.json.js'),
						prerender: false,
					});

					injectRoute({
						pattern: sdkRouteResolver('full-changelog.json'),
						entrypoint: resolve('./routes/sdk/full-changelog.json.js'),
						prerender: false,
					});

					integrationLogger(logInfo, 'Setting up StudioCMS Renderer...');

					injectRoute({
						pattern: apiRoute('render'),
						entrypoint: resolve('./routes/api/render.astro'),
						prerender: false,
					});

					if (rendererConfig.renderer === 'studiocms') {
						injectScript('page-ssr', 'import "studiocms:renderer/markdown-remark/css";');
					}

					// Check for `@astrojs/web-vitals` Integration
					checkForWebVitals(params, { name, verbose });

					// Inject First Time Setup Routes if dbStartPage is enabled
					if (dbStartPage) {
						integrationLogger(
							{ logger, logLevel: 'info', verbose },
							'Injecting First Time Setup Routes...'
						);
						injectRoute({
							pattern: 'start',
							entrypoint: routesDir.fts('1-start.astro'),
							prerender: false,
						});
						injectRoute({
							pattern: 'start/1',
							entrypoint: routesDir.fts('1-start.astro'),
							prerender: false,
						});
						injectRoute({
							pattern: 'start/2',
							entrypoint: routesDir.fts('2-next.astro'),
							prerender: false,
						});
						injectRoute({
							pattern: 'done',
							entrypoint: routesDir.fts('3-done.astro'),
							prerender: false,
						});
					}

					// Inject 404 Route if enabled
					if (shouldInject404Route) {
						integrationLogger(logInfo, 'Injecting 404 Route...');
						injectRoute({
							pattern: '404',
							entrypoint: routesDir.f0f('404.astro'),
							prerender: false,
						});
					}

					// Inject API Routes
					injectDashboardAPIRoutes(params, {
						options,
						routes: [
							{
								enabled: dashboardEnabled && !dbStartPage,
								pattern: 'live-render',
								entrypoint: routesDir.api('partials/LiveRender.astro'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage,
								pattern: 'editor',
								entrypoint: routesDir.api('partials/Editor.astro'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage,
								pattern: 'search-list',
								entrypoint: routesDir.api('search-list.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage,
								pattern: 'user-list-items',
								entrypoint: routesDir.api('partials/UserListItems.astro'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'config',
								entrypoint: routesDir.api('config.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'profile',
								entrypoint: routesDir.api('profile.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'users',
								entrypoint: routesDir.api('users.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'content/page',
								entrypoint: routesDir.api('content/page.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'content/folder',
								entrypoint: routesDir.api('content/folder.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'create-reset-link',
								entrypoint: routesDir.api('create-reset-link.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'reset-password',
								entrypoint: routesDir.api('reset-password.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'plugins/[plugin]',
								entrypoint: routesDir.api('plugins/[plugin].js'),
							},
							{
								enabled: dbStartPage,
								pattern: 'step-1',
								entrypoint: routesDir.fts('api/step-1.js'),
							},
							{
								enabled: dbStartPage,
								pattern: 'step-2',
								entrypoint: routesDir.fts('api/step-2.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'create-user',
								entrypoint: routesDir.api('create-user.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'create-user-invite',
								entrypoint: routesDir.api('create-user-invite.js'),
							},
							{
								enabled: dashboardEnabled && !dbStartPage && authEnabled,
								pattern: 'api-tokens',
								entrypoint: routesDir.api('api-tokens.js'),
							},
						],
					});

					// Inject Routes
					injectDashboardRoute(
						params,
						{
							options,
							routes: [
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: '/',
									entrypoint: routesDir.route('index.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'content-management',
									entrypoint: routesDir.route('content-management/index.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'content-management/create',
									entrypoint: routesDir.route('content-management/createpage.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'content-management/create-folder',
									entrypoint: routesDir.route('content-management/createfolder.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'content-management/edit',
									entrypoint: routesDir.route('content-management/editpage.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'content-management/edit-folder',
									entrypoint: routesDir.route('content-management/editfolder.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'content-management/diff',
									entrypoint: routesDir.route('content-management/diff.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'profile',
									entrypoint: routesDir.route('profile.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'configuration',
									entrypoint: routesDir.route('configuration.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'user-management',
									entrypoint: routesDir.route('user-management/index.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage,
									pattern: 'user-management/edit',
									entrypoint: routesDir.route('user-management/edit.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage && authEnabled,
									pattern: 'password-reset',
									entrypoint: routesDir.route('password-reset.astro'),
								},
								{
									enabled: dashboardEnabled && !dbStartPage && authEnabled,
									pattern: 'plugins/[plugin]',
									entrypoint: routesDir.route('plugins/[plugin].astro'),
								},
							],
						},
						false
					);

					// Inject API Routes
					injectAuthAPIRoutes(params, {
						options,
						routes: [
							{
								pattern: 'login',
								entrypoint: resolve('./routes/auth/api/login.js'),
								enabled: usernameAndPasswordAPI,
							},
							{
								pattern: 'logout',
								entrypoint: resolve('./routes/auth/api/logout.js'),
								enabled: dashboardEnabled && !options.dbStartPage,
							},
							{
								pattern: 'register',
								entrypoint: resolve('./routes/auth/api/register.js'),
								enabled: usernameAndPasswordAPI && allowUserRegistration,
							},
							{
								pattern: 'github',
								entrypoint: resolve('./routes/auth/api/github/index.js'),
								enabled: githubAPI,
							},
							{
								pattern: 'github/callback',
								entrypoint: resolve('./routes/auth/api/github/callback.js'),
								enabled: githubAPI,
							},
							{
								pattern: 'discord',
								entrypoint: resolve('./routes/auth/api/discord/index.js'),
								enabled: discordAPI,
							},
							{
								pattern: 'discord/callback',
								entrypoint: resolve('./routes/auth/api/discord/callback.js'),
								enabled: discordAPI,
							},
							{
								pattern: 'google',
								entrypoint: resolve('./routes/auth/api/google/index.js'),
								enabled: googleAPI,
							},
							{
								pattern: 'google/callback',
								entrypoint: resolve('./routes/auth/api/google/callback.js'),
								enabled: googleAPI,
							},
							{
								pattern: 'auth0',
								entrypoint: resolve('./routes/auth/api/auth0/index.js'),
								enabled: auth0API,
							},
							{
								pattern: 'auth0/callback',
								entrypoint: resolve('./routes/auth/api/auth0/callback.js'),
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
									entrypoint: resolve('./routes/auth/login.astro'),
									enabled: dashboardEnabled && !options.dbStartPage,
								},
								{
									pattern: 'logout/',
									entrypoint: resolve('./routes/auth/logout.astro'),
									enabled: dashboardEnabled && !options.dbStartPage,
								},
								{
									pattern: 'signup/',
									entrypoint: resolve('./routes/auth/signup.astro'),
									enabled: usernameAndPasswordAPI && allowUserRegistration,
								},
							],
						},
						false
					);

					// Inject REST API Routes if not using the dbStartPage and Auth is enabled
					if (!dbStartPage && authEnabled) {
						integrationLogger(logInfo, 'Injecting REST API Routes...');

						// Folders API Routes
						injectRoute({
							pattern: v1RestRoute('folders'),
							entrypoint: routesDir.v1Rest('folders/index.js'),
							prerender: false,
						});
						injectRoute({
							pattern: v1RestRoute('folders/[id]'),
							entrypoint: routesDir.v1Rest('folders/[id].js'),
							prerender: false,
						});

						// Pages API Routes
						injectRoute({
							pattern: v1RestRoute('pages'),
							entrypoint: routesDir.v1Rest('pages/index.js'),
							prerender: false,
						});
						injectRoute({
							pattern: v1RestRoute('pages/[id]'),
							entrypoint: routesDir.v1Rest('pages/[id]/index.js'),
							prerender: false,
						});

						// Page Diff (History) API Routes
						injectRoute({
							pattern: v1RestRoute('pages/[id]/history'),
							entrypoint: routesDir.v1Rest('pages/[id]/history/index.js'),
							prerender: false,
						});
						injectRoute({
							pattern: v1RestRoute('pages/[id]/history/[diffid]'),
							entrypoint: routesDir.v1Rest('pages/[id]/history/[diffid].js'),
							prerender: false,
						});

						// Settings API Routes
						injectRoute({
							pattern: v1RestRoute('settings'),
							entrypoint: routesDir.v1Rest('settings/index.js'),
							prerender: false,
						});

						// Users API Routes
						injectRoute({
							pattern: v1RestRoute('users'),
							entrypoint: routesDir.v1Rest('users/index.js'),
							prerender: false,
						});
						injectRoute({
							pattern: v1RestRoute('users/[id]'),
							entrypoint: routesDir.v1Rest('users/[id].js'),
							prerender: false,
						});

						// Public Pages API Routes
						injectRoute({
							pattern: v1RestRoute('public/pages'),
							entrypoint: routesDir.v1Rest('public/pages/index.js'),
							prerender: false,
						});
						injectRoute({
							pattern: v1RestRoute('public/pages/[id]'),
							entrypoint: routesDir.v1Rest('public/pages/[id].js'),
							prerender: false,
						});

						// Public Folders API Routes
						injectRoute({
							pattern: v1RestRoute('public/folders'),
							entrypoint: routesDir.v1Rest('public/folders/index.js'),
							prerender: false,
						});
						injectRoute({
							pattern: v1RestRoute('public/folders/[id]'),
							entrypoint: routesDir.v1Rest('public/folders/[id].js'),
							prerender: false,
						});
					}

					// Setup StudioCMS Integrations Array (Default Integrations)
					const integrations = [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: ui({ noInjectCSS: true }) },
					];

					integrationLogger(logInfo, 'Adding optional integrations...');

					// Robots.txt Integration (Default)
					if (includedIntegrations.robotsTXT === true) {
						integrations.push({ integration: robotsTXT() });
					} else if (typeof includedIntegrations.robotsTXT === 'object') {
						integrations.push({ integration: robotsTXT(includedIntegrations.robotsTXT) });
					}

					// Initialize and Add the default StudioCMS Plugin to the Safe Plugin List
					const safePluginList: SafePluginListType = [
						{
							name: 'StudioCMS (Built-in)',
							identifier: 'studiocms',
							pageTypes: [
								{
									label: 'Markdown (Built-in)',
									identifier: 'studiocms/markdown',
									pageContentComponent: defaultEditorComponent,
								},
								// { label: 'HTML (StudioCMS)', identifier: 'studiocms/html' },
							],
						},
					];

					integrationLogger(logInfo, 'Setting up StudioCMS plugins...');

					let sitemapEnabled = false;

					// Resolve StudioCMS Plugins
					for (const {
						name,
						identifier,
						studiocmsMinimumVersion,
						integration,
						frontendNavigationLinks,
						pageTypes,
						settingsPage,
						triggerSitemap,
					} of plugins || []) {
						// Check if the identifier is reserved
						if (identifier === 'studiocms') {
							throw new StudioCMSError(
								'Plugin Identifier "studiocms" is reserved for the default StudioCMS package.',
								`Plugin ${name} has the identifier "studiocms" which is reserved for the default StudioCMS package, please change the identifier to something else, if the plugin is from a third party, please contact the author to change the identifier.`
							);
						}

						// Check if the plugin has a minimum version requirement
						const comparison = semCompare(studiocmsMinimumVersion, pkgVersion);

						if (comparison === 1) {
							throw new StudioCMSError(
								`Plugin ${name} requires StudioCMS version ${studiocmsMinimumVersion} or higher.`,
								`Plugin ${name} requires StudioCMS version ${studiocmsMinimumVersion} or higher, please update StudioCMS to the required version, contact the plugin author to update the minimum version requirement or remove the plugin from the StudioCMS config.`
							);
						}

						// Add the plugin Integration to the Astro config
						if (integration && Array.isArray(integration)) {
							integrations.push(...integration.map((integration) => ({ integration })));
						} else if (integration) {
							integrations.push({ integration });
						}

						if (triggerSitemap) sitemapEnabled = triggerSitemap;

						safePluginList.push({
							identifier,
							name,
							frontendNavigationLinks,
							pageTypes,
							settingsPage,
						});
					}

					const defaultDashboardRoute = dashboardRouteOverride
						? removeLeadingTrailingSlashes(dashboardRouteOverride)
						: 'dashboard';

					if (sitemapEnabled) {
						integrations.push({
							integration: sitemap({
								filter: (route) =>
									!route.includes(`${config.site}/${defaultDashboardRoute}`) &&
									!route.includes('/studiocms_api/'),
							}),
						});
					}

					// Setup Integrations
					addIntegrationArray(params, integrations);

					integrationLogger(logInfo, 'Adding Virtual Imports...');

					defineModule('studiocms:plugins', {
						defaultExport: safePluginList,
					});

					defineModule('studiocms:config', {
						defaultExport: options,
						constExports: {
							config: options,
							dashboardConfig: options.dashboardConfig,
							AuthConfig: options.dashboardConfig.AuthConfig,
							developerConfig: options.dashboardConfig.developerConfig,
							defaultFrontEndConfig: options.defaultFrontEndConfig,
							sdk: options.sdk,
						},
					});

					defineModule('studiocms:version', {
						defaultExport: pkgVersion,
					});

					const allPageTypes = safePluginList.flatMap(({ pageTypes }) => pageTypes || []);

					const editorKeys = allPageTypes.map(({ identifier }) => convertToSafeString(identifier));

					const editorComponents = allPageTypes
						.map(({ identifier, pageContentComponent }) => {
							if (!pageContentComponent) {
								return `export { default as ${convertToSafeString(identifier)} } from '${defaultEditorComponent}';`;
							}
							return `export { default as ${convertToSafeString(identifier)} } from '${pageContentComponent}';`;
						})
						.join('\n');

					const componentKeys = ComponentRegistry
						? Object.keys(ComponentRegistry).map((key) => key.toLowerCase())
						: [];

					const components = ComponentRegistry
						? Object.entries(ComponentRegistry)
								.map(
									([key, value]) =>
										`export { default as ${key} } from '${astroConfigResolve(value)}';`
								)
								.join('\n')
						: '';

					addVirtualImports(params, {
						name,
						imports: {
							// Core Virtual Components
							'studiocms:components': `
								export { default as FormattedDate } from '${
									options.overrides.FormattedDateOverride
										? astroConfigResolve(options.overrides.FormattedDateOverride)
										: resolve('./components/FormattedDate.astro')
								}';
								export { default as Generator } from '${resolve('./components/Generator.astro')}';
							`,

							'virtual:studiocms/components/Editors': `
								export const editorKeys = ${JSON.stringify([...editorKeys])};
								${editorComponents}
							`,

							// StudioCMS lib
							'studiocms:lib': `
								export * from '${resolve('./lib/head.js')}';
								export * from '${resolve('./lib/headDefaults.js')}';
								export * from '${resolve('./lib/jsonUtils.js')}';
								export * from '${resolve('./lib/pathGenerators.js')}';
								export * from '${resolve('./lib/removeLeadingTrailingSlashes.js')}';
								export * from '${resolve('./lib/routeMap.js')}';
								export * from '${resolve('./lib/urlGen.js')}';
							`,

							// SDK Virtual Modules
							'virtual:studiocms/sdk/env': `
								export const dbUrl = '${env.ASTRO_DB_REMOTE_URL}';
								export const dbSecret = '${env.ASTRO_DB_APP_TOKEN}';
								export const cmsEncryptionKey = '${env.CMS_ENCRYPTION_KEY}';
							`,

							'studiocms:sdk': `
								import studioCMS_SDK from '${resolve('./sdk/index.js')}';
								export default studioCMS_SDK;
							`,
							'studiocms:sdk/cache': `
								export * from '${resolve('./sdk/cache.js')}';
								import studioCMS_SDK_Cache from '${resolve('./sdk/cache.js')}';
								export default studioCMS_SDK_Cache;
							`,
							'studiocms:sdk/types': `
								export * from '${resolve('./sdk/types.js')}';
							`,

							// i18n Virtual Module
							'studiocms:i18n': `
								export * from '${resolve('./lib/i18n/index.js')}';
								export { default as LanguageSelector } from '${resolve('./lib/i18n/LanguageSelector.astro')}';
							`,

							// User Virtual Components
							'studiocms:component-proxy': `
								export const componentKeys = ${JSON.stringify(componentKeys || [])};
								${components}
							`,

							// Plugin Helpers
							'studiocms:plugin-helpers': `
								export * from "${resolve('./plugins.js')}";
							`,

							// Renderer Virtual Imports
							'studiocms:renderer/config': `
								export default ${JSON.stringify(options.rendererConfig)};
							`,
							'studiocms:renderer': `
								export { default as StudioCMSRenderer } from '${RendererComponent}';
							`,
							'studiocms:renderer/current': `
								export * from '${resolve('./lib/renderer/contentRenderer.js')}';
								import contentRenderer from '${resolve('./lib/renderer/contentRenderer.js')}';
								export default contentRenderer;
							`,
							'studiocms:renderer/markdown-remark/css': `
								import '${resolve('./styles/md-remark-headings.css')}';
								${rendererConfig.studiocms.callouts.enabled ? `import '${resolvedCalloutTheme}';` : ''}
							`,

							// Image Handler Virtual Imports
							'studiocms:imageHandler/components': `
								export { default as CustomImage } from '${imageComponentPath}';
							`,

							// Auth Virtual Imports
							'studiocms:auth/lib/encryption': `
								export * from '${resolve('./lib/auth/encryption.js')}'
							`,
							'studiocms:auth/lib/password': `
								export * from '${resolve('./lib/auth/password.js')}'
							`,
							'studiocms:auth/lib/rate-limit': `
								export * from '${resolve('./lib/auth/rate-limit.js')}'
							`,
							'studiocms:auth/lib/session': `
								export * from '${resolve('./lib/auth/session.js')}'
							`,
							'studiocms:auth/lib/types': `
								export * from '${resolve('./lib/auth/types.js')}'
							`,
							'studiocms:auth/lib/user': `
								export * from '${resolve('./lib/auth/user.js')}'
							`,
							'studiocms:auth/utils/authEnvCheck': `
								export * from '${resolve('./utils/authEnvCheck.js')}'
							`,
							'studiocms:auth/utils/validImages': `
								export * from '${resolve('./utils/validImages.js')}'
							`,
							'studiocms:auth/utils/getLabelForPermissionLevel': `
								export * from '${resolve('./utils/getLabelForPermissionLevel.js')}'
							`,
							'studiocms:auth/scripts/three': `
								import '${resolve('./scripts/three.js')}';
							`,
						},
					});

					// Update the Astro Config
					updateConfig({
						image: {
							remotePatterns: [
								{
									protocol: 'https',
								},
							],
						},
						vite: {
							optimizeDeps: {
								exclude: ['three'],
							},
							plugins: [
								inlineModPlugin(),
								copy({
									copyOnce: true,
									hook: 'buildStart',
									targets: [
										{
											src: resolve('../static/studiocms-resources/*'),
											dest: 'public/studiocms-resources/',
										},
									],
								}),
							],
						},
					});

					let pluginListLength = 0;
					let pluginListMessage = '';

					pluginListLength = safePluginList.length;
					pluginListMessage = safePluginList.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

					const messageBox = boxen(pluginListMessage, {
						padding: 1,
						title: `Currently Installed StudioCMS Modules (${pluginListLength})`,
					});

					messages.push({
						label: 'studiocms:plugins',
						logLevel: 'info',
						message: ` \n \n${messageBox} \n \n`,
					});

					changelogHelper(params);
				},
				// Config Done: Make DTS file for StudioCMS Plugins Virtual Module
				'astro:config:done': ({ injectTypes, config }) => {
					const { resolve: astroConfigResolve } = createResolver(config.root.pathname);

					const injectedTypes = getInjectedTypes(
						ComponentRegistry,
						imageComponentPath,
						astroConfigResolve
					);

					for (const type of injectedTypes) {
						injectTypes(type);
					}

					// Inject the Markdown configuration into the shared state
					shared.markdownConfig = config.markdown;
					shared.studiocms = options.rendererConfig.studiocms;

					// Log Setup Complete
					messages.push({
						label: 'studiocms:setup',
						logLevel: 'info',
						message: 'Setup Complete. 🚀',
					});
				},
				// DEV SERVER: Check for updates on server start and log messages
				'astro:server:start': async ({ logger: l }) => {
					const logger = l.fork(`${pkgName}:update-check`);

					try {
						const { version: latestVersion } = await packageJson(pkgName.toLowerCase());

						const comparison = semCompare(pkgVersion, latestVersion);

						if (comparison === -1) {
							logger.warn(
								`A new version of '${pkgName}' is available. Please update to ${latestVersion} using your favorite package manager.`
							);
						} else if (comparison === 0) {
							logger.info(`You are using the latest version of '${pkgName}' (${pkgVersion})`);
						} else {
							logger.info(
								`You are using a newer version (${pkgVersion}) of '${pkgName}' than the latest release (${latestVersion})`
							);
						}
					} catch (error) {
						if (error instanceof Error) {
							logger.error(`Error fetching latest version from npm registry: ${error.message}`);
						} else {
							// Handle the case where error is not an Error object
							logger.error(
								'An unknown error occurred while fetching the latest version from the npm registry.'
							);
						}
					}

					// Log all messages
					for (const { label, message, logLevel } of messages) {
						integrationLogger(
							{
								logger: l.fork(label),
								logLevel,
								verbose: logLevel === 'info' ? options.verbose : true,
							},
							message
						);
					}

					if (options.dbStartPage) {
						integrationLogger(
							{ logger, logLevel: 'warn', verbose: true },
							'Start Page is Enabled.  This will be the only page available until you initialize your database and disable the config option forcing this page to be displayed. To get started, visit http://localhost:4321/start/ in your browser to initialize your database. And Setup your installation.'
						);
					}
				},
				// BUILD: Log messages at the end of the build
				'astro:build:done': ({ logger }) => {
					// Log messages at the end of the build
					for (const { label, message, logLevel } of messages) {
						integrationLogger(
							{
								logger: logger.fork(label),
								logLevel,
								verbose: logLevel === 'info' ? options.verbose : true,
							},
							message
						);
					}
				},
			},
		};
	},
});
