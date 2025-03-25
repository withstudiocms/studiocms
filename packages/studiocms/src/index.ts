/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS integration in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="@astrojs/db" preserve="true" />
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="./theme.d.ts" preserve="true" />

import fs from 'node:fs';
import inlineModPlugin, { defineModule } from '@inox-tools/inline-mod/vite';
import { runtimeLogger } from '@inox-tools/runtime-logger';
import ui from '@studiocms/ui';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { envField } from 'astro/config';
import { z } from 'astro/zod';
import boxen from 'boxen';
import packageJson from 'package-json';
import { compare as semCompare } from 'semver';
import { loadEnv } from 'vite';
import {
	StudioCMSMarkdownDefaults,
	authAPIRoute,
	dashboardAPIRoute,
	makeDashboardRoute,
	routesDir,
} from './consts.js';
import { StudioCMSError } from './errors.js';
import type { GridItemInput } from './lib/dashboardGrid.js';
import { dynamicSitemap } from './lib/dynamic-sitemap/index.js';
import { apiRoute, sdkRouteResolver, v1RestRoute } from './lib/index.js';
import { shared } from './lib/renderer/shared.js';
import robotsTXT from './lib/robots/index.js';
import { checkForWebVitals } from './lib/webVitals/checkForWebVitalsPlugin.js';
import type {
	AvailableDashboardPages,
	SafePluginListType,
	StudioCMSConfig,
	StudioCMSOptions,
	StudioCMSPlugin,
} from './schemas/index.js';
import type { Messages, Route, Script } from './types.js';
import { addIntegrationArray } from './utils/addIntegrationArray.js';
import { checkAstroConfig } from './utils/astroConfigCheck.js';
import { addAstroEnvConfig } from './utils/astroEnvConfig.js';
import { changelogHelper } from './utils/changelog.js';
import { checkEnvKeys } from './utils/checkENV.js';
import { watchStudioCMSConfig } from './utils/configManager.js';
import { configResolver } from './utils/configResolver.js';
import { integrationLogger } from './utils/integrationLogger.js';
import { nodeNamespaceBuiltinsAstro } from './utils/integrations.js';
import { pageContentComponentFilter, rendererComponentFilter } from './utils/pageTypeFilter.js';
import { readJson } from './utils/readJson.js';
import { convertToSafeString } from './utils/safeString.js';

// Resolver Function
const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { name: pkgName, version: pkgVersion } = readJson<{ name: string; version: string }>(
	resolve('../package.json')
);

// Load Environment Variables
const env = loadEnv('', process.cwd(), '');

// Renderer Component Resolver
const RendererComponent = resolve('./components/Renderer.astro');

// Default Custom Image Component Resolver
const defaultCustomImageComponent = resolve('./components/image/CustomImage.astro');

// Default Page Type Components
const DefaultPageTypeComponents = {
	'studiocms/markdown': {
		pageContentComponent: resolve('./components/editors/markdown.astro'),
		rendererComponent: resolve('./components/renderers/studiocms-markdown.astro'),
	},
	'studiocms/html': {
		pageContentComponent: resolve('./components/editors/html.astro'),
		rendererComponent: resolve('./components/renderers/studiocms-html.astro'),
	},
};

/**
 * **Default StudioCMS Plugin**
 *
 * The default StudioCMS Plugin that comes with StudioCMS.
 *
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
const defaultPlugin: StudioCMSPlugin = {
	name: 'StudioCMS (Built-in)',
	identifier: 'studiocms',
	studiocmsMinimumVersion: pkgVersion,
	dashboardGridItems: [
		{
			name: 'overview',
			span: 1,
			variant: 'default',
			requiresPermission: 'editor',
			header: { title: 'Overview', icon: 'bolt' },
			body: {
				html: '<totals></totals>',
				components: {
					totals: resolve('./components/default-grid-items/Totals.astro'),
				},
			},
		},
		{
			name: 'recently-updated-pages',
			span: 2,
			variant: 'default',
			requiresPermission: 'editor',
			header: { title: 'Recently Updated Pages', icon: 'document-arrow-up' },
			body: {
				html: '<recentlyupdatedpages></recentlyupdatedpages>',
				components: {
					recentlyupdatedpages: resolve(
						'./components/default-grid-items/Recently-updated-pages.astro'
					),
				},
			},
		},
		{
			name: 'recently-signed-up-users',
			span: 1,
			variant: 'default',
			requiresPermission: 'admin',
			header: { title: 'Recently Signed Up Users', icon: 'user-group' },
			body: {
				html: '<recentlysignedupusers></recentlysignedupusers>',
				components: {
					recentlysignedupusers: resolve(
						'./components/default-grid-items/Recently-signed-up.astro'
					),
				},
			},
		},
		{
			name: 'recently-created-pages',
			span: 2,
			variant: 'default',
			requiresPermission: 'editor',
			header: { title: 'Recently Created Pages', icon: 'document-plus' },
			body: {
				html: '<recentlycreatedpages></recentlycreatedpages>',
				components: {
					recentlycreatedpages: resolve(
						'./components/default-grid-items/Recently-created-pages.astro'
					),
				},
			},
		},
	],
	pageTypes: [
		{
			label: 'Markdown (Built-in)',
			identifier: 'studiocms/markdown',
			pageContentComponent: DefaultPageTypeComponents['studiocms/markdown'].pageContentComponent,
			rendererComponent: DefaultPageTypeComponents['studiocms/markdown'].rendererComponent,
		},
		{
			label: 'HTML (Built-in)',
			identifier: 'studiocms/html',
			pageContentComponent: DefaultPageTypeComponents['studiocms/html'].pageContentComponent,
			rendererComponent: DefaultPageTypeComponents['studiocms/html'].rendererComponent,
		},
	],
};

/**
 * **StudioCMS Integration**
 *
 * A CMS built for Astro by the Astro Community for the Astro Community.
 *
 * @see The [GitHub Repo: `withstudiocms/studiocms`](https://github.com/withstudiocms/studiocms) for more information on how to contribute to StudioCMS.
 * @see The [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 *
 */
export const studiocms = defineIntegration({
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
		let resolvedCalloutTheme: string | undefined;

		// Define the Image Component Path
		let imageComponentPath: string;

		// Define the available Dashboard Grid Items
		const availableDashboardGridItems: GridItemInput[] = [];

		// Define the available Dashboard Pages
		const availableDashboardPages: AvailableDashboardPages = {
			user: [],
			admin: [],
		};

		// Define the Safe Plugin List
		const safePluginList: SafePluginListType = [];

		// Define if the Sitemap is enabled
		let sitemapEnabled = false;

		// Define the Sitemaps Array
		const sitemaps: {
			pluginName: string;
			sitemapXMLEndpointPath: string | URL;
		}[] = [];

		// Define the Plugin Endpoints
		const pluginEndpoints: {
			apiEndpoint: string;
			identifier: string;
			safeIdentifier: string;
		}[] = [];

		// Define the Plugin Settings Endpoints
		const pluginSettingsEndpoints: {
			apiEndpoint: string;
			identifier: string;
			safeIdentifier: string;
		}[] = [];

		const pluginRenderers: {
			pageType: string;
			safePageType: string;
			content: string;
		}[] = [];

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

					const { resolve: astroConfigResolve } = createResolver(config.root.pathname);

					logger.info('Checking configuration...');

					// Watch the StudioCMS Config File
					watchStudioCMSConfig(params);

					// Resolve the StudioCMS Configuration
					options = await configResolver(params, opts);

					const {
						verbose,
						pageTypeOptions,
						includedIntegrations,
						imageService,
						plugins,
						componentRegistry,
						overrides,
						dbStartPage,
						dashboardConfig: {
							dashboardEnabled,
							inject404Route,
							dashboardRouteOverride,
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
							developerConfig: { demoMode },
						},
						defaultFrontEndConfig,
					} = options;

					const frontendConfig =
						typeof defaultFrontEndConfig === 'object'
							? defaultFrontEndConfig
							: {
									htmlDefaultLanguage: 'en',
									htmlDefaultHead: [],
									favicon: '/favicon.svg',
									injectQuickActionsMenu: true,
								};

					const shouldInject404Route = inject404Route && dashboardEnabled;

					// Create logInfo object
					const logInfo = { logger, logLevel: 'info' as const, verbose };

					// Check for Component Registry
					if (componentRegistry) ComponentRegistry = componentRegistry;

					const dashboardRoute = makeDashboardRoute(dashboardRouteOverride);
					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS...');

					runtimeLogger(params, {
						name: 'studiocms-runtime',
					});

					// Check Astro Config for required settings
					checkAstroConfig(params);

					// Setup Logger
					integrationLogger(logInfo, 'Setting up StudioCMS internals...');

					// Add Astro Environment Configuration
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
							// Cloudinary Environment Variables for Custom Image Component
							CMS_CLOUDINARY_CLOUDNAME: envField.string({
								context: 'server',
								access: 'secret',
								optional: true,
							}),
						},
					});
					checkEnvKeys(logger, options);
					changelogHelper(params);

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
						: defaultCustomImageComponent;

					const routes: Route[] = [
						{
							pattern: 'start',
							entrypoint: routesDir.fts('1-start.astro'),
							enabled: dbStartPage,
						},
						{
							pattern: 'start/1',
							entrypoint: routesDir.fts('1-start.astro'),
							enabled: dbStartPage,
						},
						{
							pattern: 'start/2',
							entrypoint: routesDir.fts('2-next.astro'),
							enabled: dbStartPage,
						},
						{
							pattern: 'done',
							entrypoint: routesDir.fts('3-done.astro'),
							enabled: dbStartPage,
						},
						{
							pattern: '404',
							entrypoint: routesDir.errors('404.astro'),
							enabled: shouldInject404Route && !dbStartPage,
						},
						{
							pattern: sdkRouteResolver('list-pages'),
							entrypoint: routesDir.sdk('list-pages.ts'),
							enabled: !dbStartPage,
						},
						{
							pattern: sdkRouteResolver('update-latest-version-cache'),
							entrypoint: routesDir.sdk('update-latest-version-cache.ts'),
							enabled: !dbStartPage,
						},
						{
							pattern: sdkRouteResolver('fallback-list-pages.json'),
							entrypoint: routesDir.sdk('fallback-list-pages.json.ts'),
							enabled: !dbStartPage,
						},
						{
							pattern: sdkRouteResolver('full-changelog.json'),
							entrypoint: routesDir.sdk('full-changelog.json.ts'),
							enabled: !dbStartPage,
						},
						{
							pattern: apiRoute('render'),
							entrypoint: routesDir.api('render.astro'),
							enabled: !dbStartPage,
						},
						{
							pattern: dashboardAPIRoute('live-render'),
							entrypoint: routesDir.dashApi('partials/LiveRender.astro'),
							enabled: dashboardEnabled && !dbStartPage,
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardAPIRoute('editor'),
							entrypoint: routesDir.dashApi('partials/Editor.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardAPIRoute('search-list'),
							entrypoint: routesDir.dashApi('search-list.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardAPIRoute('user-list-items'),
							entrypoint: routesDir.dashApi('partials/UserListItems.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('config'),
							entrypoint: routesDir.dashApi('config.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('profile'),
							entrypoint: routesDir.dashApi('profile.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('users'),
							entrypoint: routesDir.dashApi('users.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('content/page'),
							entrypoint: routesDir.dashApi('content/page.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('content/folder'),
							entrypoint: routesDir.dashApi('content/folder.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('content/diff'),
							entrypoint: routesDir.dashApi('content/diff.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('create-reset-link'),
							entrypoint: routesDir.dashApi('create-reset-link.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('reset-password'),
							entrypoint: routesDir.dashApi('reset-password.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('plugins/[plugin]'),
							entrypoint: routesDir.dashApi('plugins/[plugin].ts'),
						},
						{
							enabled: dbStartPage,
							pattern: dashboardAPIRoute('step-1'),
							entrypoint: routesDir.fts('api/step-1.ts'),
						},
						{
							enabled: dbStartPage,
							pattern: dashboardAPIRoute('step-2'),
							entrypoint: routesDir.fts('api/step-2.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('create-user'),
							entrypoint: routesDir.dashApi('create-user.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('create-user-invite'),
							entrypoint: routesDir.dashApi('create-user-invite.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('api-tokens'),
							entrypoint: routesDir.dashApi('api-tokens.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('verify-session'),
							entrypoint: routesDir.dashApi('verify-session.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('mailer/config'),
							entrypoint: routesDir.mailer('config.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('mailer/test-email'),
							entrypoint: routesDir.mailer('test-email.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('verify-email'),
							entrypoint: routesDir.dashApi('verify-email.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('email-notification-settings-site'),
							entrypoint: routesDir.dashApi('email-notification-settings-site.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('resend-verify-email'),
							entrypoint: routesDir.dashApi('resend-verify-email.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardAPIRoute('update-user-notifications'),
							entrypoint: routesDir.dashApi('update-user-notifications.ts'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('/'),
							entrypoint: routesDir.dashRoute('index.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('content-management'),
							entrypoint: routesDir.dashRoute('content-management/index.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('content-management/create'),
							entrypoint: routesDir.dashRoute('content-management/createpage.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('content-management/create-folder'),
							entrypoint: routesDir.dashRoute('content-management/createfolder.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('content-management/edit'),
							entrypoint: routesDir.dashRoute('content-management/editpage.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('content-management/edit-folder'),
							entrypoint: routesDir.dashRoute('content-management/editfolder.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('content-management/diff'),
							entrypoint: routesDir.dashRoute('content-management/diff.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('profile'),
							entrypoint: routesDir.dashRoute('profile.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('configuration'),
							entrypoint: routesDir.dashRoute('configuration.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('user-management'),
							entrypoint: routesDir.dashRoute('user-management/index.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('user-management/edit'),
							entrypoint: routesDir.dashRoute('user-management/edit.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage && authEnabled,
							pattern: dashboardRoute('password-reset'),
							entrypoint: routesDir.dashRoute('password-reset.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('plugins/[plugin]'),
							entrypoint: routesDir.dashRoute('plugins/[plugin].astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('smtp-configuration'),
							entrypoint: routesDir.dashRoute('smtp-configuration.astro'),
						},
						{
							enabled: dashboardEnabled && !dbStartPage,
							pattern: dashboardRoute('unverified-email'),
							entrypoint: routesDir.dashRoute('unverified-email.astro'),
						},
						{
							pattern: authAPIRoute('login'),
							entrypoint: routesDir.authAPI('login.ts'),
							enabled: usernameAndPasswordAPI,
						},
						{
							pattern: authAPIRoute('logout'),
							entrypoint: routesDir.authAPI('logout.ts'),
							enabled: dashboardEnabled && !options.dbStartPage,
						},
						{
							pattern: authAPIRoute('register'),
							entrypoint: routesDir.authAPI('register.ts'),
							enabled: usernameAndPasswordAPI && allowUserRegistration,
						},
						{
							pattern: authAPIRoute('github'),
							entrypoint: routesDir.authAPI('github/index.ts'),
							enabled: githubAPI,
						},
						{
							pattern: authAPIRoute('github/callback'),
							entrypoint: routesDir.authAPI('github/callback.ts'),
							enabled: githubAPI,
						},
						{
							pattern: authAPIRoute('discord'),
							entrypoint: routesDir.authAPI('discord/index.ts'),
							enabled: discordAPI,
						},
						{
							pattern: authAPIRoute('discord/callback'),
							entrypoint: routesDir.authAPI('discord/callback.ts'),
							enabled: discordAPI,
						},
						{
							pattern: authAPIRoute('google'),
							entrypoint: routesDir.authAPI('google/index.ts'),
							enabled: googleAPI,
						},
						{
							pattern: authAPIRoute('google/callback'),
							entrypoint: routesDir.authAPI('google/callback.ts'),
							enabled: googleAPI,
						},
						{
							pattern: authAPIRoute('auth0'),
							entrypoint: routesDir.authAPI('auth0/index.ts'),
							enabled: auth0API,
						},
						{
							pattern: authAPIRoute('auth0/callback'),
							entrypoint: routesDir.authAPI('auth0/callback.ts'),
							enabled: auth0API,
						},
						{
							pattern: authAPIRoute('forgot-password'),
							entrypoint: routesDir.authAPI('forgot-password.ts'),
							enabled: usernameAndPasswordAPI,
						},
						{
							pattern: dashboardRoute('login/'),
							entrypoint: routesDir.authPage('login.astro'),
							enabled: dashboardEnabled && !options.dbStartPage,
						},
						{
							pattern: dashboardRoute('logout/'),
							entrypoint: routesDir.authPage('logout.astro'),
							enabled: dashboardEnabled && !options.dbStartPage,
						},
						{
							pattern: dashboardRoute('signup/'),
							entrypoint: routesDir.authPage('signup.astro'),
							enabled: usernameAndPasswordAPI && allowUserRegistration,
						},
						{
							pattern: v1RestRoute('folders'),
							entrypoint: routesDir.v1Rest('folders/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('folders/[id]'),
							entrypoint: routesDir.v1Rest('folders/[id].ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('pages'),
							entrypoint: routesDir.v1Rest('pages/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('pages/[id]'),
							entrypoint: routesDir.v1Rest('pages/[id]/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('pages/[id]/history'),
							entrypoint: routesDir.v1Rest('pages/[id]/history/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('pages/[id]/history/[diffid]'),
							entrypoint: routesDir.v1Rest('pages/[id]/history/[diffid].ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('settings'),
							entrypoint: routesDir.v1Rest('settings/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('users'),
							entrypoint: routesDir.v1Rest('users/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('users/[id]'),
							entrypoint: routesDir.v1Rest('users/[id].ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('public/pages'),
							entrypoint: routesDir.v1Rest('public/pages/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('public/pages/[id]'),
							entrypoint: routesDir.v1Rest('public/pages/[id].ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
						{
							pattern: v1RestRoute('public/folders'),
							entrypoint: routesDir.v1Rest('public/folders/index.ts'),
							enabled: !dbStartPage && authEnabled && !demoMode,
						},
					];

					// Resolve the callout theme based on the user's configuration
					if (
						pageTypeOptions.markdown.flavor === 'studiocms' &&
						pageTypeOptions.markdown.callouts !== false
					) {
						resolvedCalloutTheme = resolve(
							`./styles/md-remark-callouts/${pageTypeOptions.markdown.callouts || 'obsidian'}.css`
						);
					}

					const scripts: Script[] = [
						{
							content: 'import "studiocms:renderer/markdown-remark/css";',
							stage: 'page-ssr',
							enabled: pageTypeOptions.markdown.flavor === 'studiocms',
						},
						{
							content: fs.readFileSync(resolve('./components/user-quick-tools.js'), 'utf-8'),
							stage: 'page',
							enabled: frontendConfig.injectQuickActionsMenu && !dbStartPage,
						},
					];

					// Setup StudioCMS Integrations Array (Default Integrations)
					const integrations = [
						{ integration: nodeNamespaceBuiltinsAstro() },
						{ integration: ui({ noInjectCSS: true }) },
					];

					integrationLogger(logInfo, 'Setting up StudioCMS plugins...');

					if (!dbStartPage) {
						// Check for `@astrojs/web-vitals` Integration
						const wvPlugin = checkForWebVitals(params, { name, verbose, version: pkgVersion });

						// Initialize and Add the default StudioCMS Plugin to the Safe Plugin List
						const pluginsToProcess: StudioCMSPlugin[] = [defaultPlugin];

						if (wvPlugin) pluginsToProcess.push(wvPlugin);

						if (plugins) pluginsToProcess.push(...plugins);

						// Resolve StudioCMS Plugins
						for (const {
							studiocmsMinimumVersion,
							integration,
							triggerSitemap,
							sitemaps: pluginSitemaps,
							dashboardGridItems,
							dashboardPages,
							...safePlugin
						} of pluginsToProcess || []) {
							// Check if the plugin has a minimum version requirement
							const comparison = semCompare(studiocmsMinimumVersion, pkgVersion);

							if (comparison === 1) {
								throw new StudioCMSError(
									`Plugin ${safePlugin.name} requires StudioCMS version ${studiocmsMinimumVersion} or higher.`,
									`Plugin ${safePlugin.name} requires StudioCMS version ${studiocmsMinimumVersion} or higher, please update StudioCMS to the required version, contact the plugin author to update the minimum version requirement or remove the plugin from the StudioCMS config.`
								);
							}

							// Add the plugin Integration to the Astro config
							if (integration && Array.isArray(integration)) {
								integrations.push(...integration.map((integration) => ({ integration })));
							} else if (integration) {
								integrations.push({ integration });
							}

							if (triggerSitemap) sitemapEnabled = triggerSitemap;

							if (pluginSitemaps) {
								sitemaps.push(...pluginSitemaps);
							}

							if (dashboardGridItems) {
								availableDashboardGridItems.push(
									...dashboardGridItems.map((item) => ({
										...item,
										name: `${convertToSafeString(safePlugin.identifier)}/${convertToSafeString(item.name)}`,
									}))
								);
							}

							if (dashboardPages) {
								if (dashboardPages.user) {
									availableDashboardPages.user?.push(
										...dashboardPages.user.map((page) => ({
											...page,
											slug: `${convertToSafeString(safePlugin.identifier)}/${convertToSafeString(page.route)}`,
										}))
									);
								}
								if (dashboardPages.admin) {
									availableDashboardPages.admin?.push(
										...dashboardPages.admin.map((page) => ({
											...page,
											slug: `${convertToSafeString(safePlugin.identifier)}/${convertToSafeString(page.route)}`,
										}))
									);
								}
							}

							for (const { apiEndpoint, identifier, rendererComponent } of safePlugin.pageTypes ||
								[]) {
								if (apiEndpoint) {
									pluginEndpoints.push({
										identifier: identifier,
										safeIdentifier: convertToSafeString(identifier),
										apiEndpoint: `
											export { onCreate as ${convertToSafeString(identifier)}_onCreate } from '${apiEndpoint}';
											export { onEdit as ${convertToSafeString(identifier)}_onEdit } from '${apiEndpoint}';
											export { onDelete as ${convertToSafeString(identifier)}_onDelete } from '${apiEndpoint}';
										`,
									});
								}

								if (rendererComponent) {
									const builtIns = rendererComponentFilter(
										rendererComponent,
										convertToSafeString(identifier),
										DefaultPageTypeComponents
									);
									pluginRenderers.push({
										pageType: identifier,
										safePageType: convertToSafeString(identifier),
										content: builtIns,
									});
								}
							}

							if (safePlugin.settingsPage) {
								const { endpoint } = safePlugin.settingsPage;

								if (endpoint) {
									pluginSettingsEndpoints.push({
										identifier: safePlugin.identifier,
										safeIdentifier: convertToSafeString(safePlugin.identifier),
										apiEndpoint: `
											export { onSave as ${convertToSafeString(safePlugin.identifier)}_onSave } from '${endpoint}';
										`,
									});
								}
							}

							safePluginList.push(safePlugin);
						}

						// Robots.txt Integration (Default)
						if (includedIntegrations.robotsTXT === true) {
							integrations.push({ integration: robotsTXT({ sitemap: sitemapEnabled }) });
						} else if (typeof includedIntegrations.robotsTXT === 'object') {
							integrations.push({
								integration: robotsTXT({
									...includedIntegrations.robotsTXT,
									sitemap: sitemapEnabled,
								}),
							});
						}

						if (sitemapEnabled) {
							integrations.push({
								integration: dynamicSitemap({ sitemaps }),
							});
						}

						// Inject Dashboard plugin page route, if any plugins have dashboard pages
						if (
							(availableDashboardPages.user && availableDashboardPages.user.length > 0) ||
							(availableDashboardPages.admin && availableDashboardPages.admin.length > 0)
						) {
							routes.push({
								enabled: true,
								pattern: dashboardRoute('[...pluginPage]'),
								entrypoint: routesDir.dashRoute('[...pluginPage].astro'),
							});
						}
					}

					// Setup Integrations
					addIntegrationArray(params, integrations);

					// Inject Routes
					for (const { enabled, ...rest } of routes) {
						if (enabled) injectRoute({ ...rest, prerender: false });
					}

					// Inject Scripts
					for (const { enabled, stage, content } of scripts) {
						if (enabled) injectScript(stage, content);
					}

					// Inject Virtual modules
					integrationLogger(logInfo, 'Adding Virtual Imports...');

					// Modules that don't rely on dbStartPage
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

					defineModule('studiocms:plugins', {
						defaultExport: safePluginList,
					});

					defineModule('studiocms:version', {
						defaultExport: pkgVersion,
					});

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

							'studiocms:mailer': `
								export * from '${resolve('./lib/mailer/index.js')}';
							`,
							'studiocms:mailer/templates': `
								import { getTemplate } from '${resolve('./lib/mailer/template.js')}';
								export { getTemplate };
								export default getTemplate;
							`,

							'studiocms:notifier': `
								export * from '${resolve('./lib/notifier/index.js')}';
							`,
							'studiocms:notifier/client': `
								export * from '${resolve('./lib/notifier/client.js')}';
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
							'studiocms:sdk/types': `
								export * from '${resolve('./sdk/types.js')}';
							`,

							// i18n Virtual Module
							'studiocms:i18n': `
								export * from '${resolve('./lib/i18n/index.js')}';
								export { default as LanguageSelector } from '${resolve('./lib/i18n/LanguageSelector.astro')}';
							`,
							'studiocms:i18n/client': `
								export * from '${resolve('./lib/i18n/client.js')}';
							`,

							'studiocms:logger': `
								import { logger as _logger } from '@it-astro:logger:studiocms-runtime';

								export const logger = _logger.fork('studiocms:runtime');

								export default logger;

								const apiLogger = _logger.fork('studiocms:runtime/api');

								export const isVerbose = ${verbose};

								function buildErrorMessage(message, error) {
									if (!error) return message;
									if (error instanceof Error) return message + ': ' + error.message + '\\n' + error.stack;
									return message + ': ' + error;
								};

								export function apiResponseLogger(status, message, error) {
									if (status !== 200) {
										apiLogger.error(buildErrorMessage(message, error));
										return new Response(JSON.stringify({ error: message }), { 
											status, 
											headers: { 'Content-Type': 'application/json' } 
										});
									}
									isVerbose &&  apiLogger.info(message);
									return new Response(JSON.stringify({ message }), { 
										status, 
										headers: { 'Content-Type': 'application/json' } 
									});
								};
							`,

							// Plugin Helpers
							'studiocms:plugin-helpers': `
								export * from "${resolve('./plugins.js')}";
								export * from "${resolve('./lib/plugins/index.js')}";
							`,

							// Renderer Virtual Imports
							'studiocms:renderer/config': `
								export default ${JSON.stringify(options.pageTypeOptions.markdown)};
							`,
							'studiocms:renderer': `
								export { default as StudioCMSRenderer } from '${RendererComponent}';
							`,
							'studiocms:renderer/markdown-remark/css': `
								import '${resolve('./styles/md-remark-headings.css')}';
								${resolvedCalloutTheme ? `import '${resolvedCalloutTheme}';` : ''}
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
							'studiocms:auth/lib/verify-email': `
								export * from '${resolve('./lib/auth/verify-email.js')}';
							`,
						},
					});

					if (!dbStartPage) {
						const allPageTypes = safePluginList.flatMap(({ pageTypes }) => pageTypes || []);

						const editorKeys = allPageTypes.map(({ identifier }) =>
							convertToSafeString(identifier)
						);

						const editorComponents = allPageTypes
							.map(({ identifier, pageContentComponent }) => {
								return pageContentComponentFilter(
									pageContentComponent,
									convertToSafeString(identifier),
									DefaultPageTypeComponents
								);
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

						const dashboardGridComponents = availableDashboardGridItems
							.map((item) => {
								const components: Record<string, string> = item.body?.components || {};

								const remappedComps = Object.entries(components).map(
									([key, value]) => `export { default as ${key} } from '${value}';`
								);

								return remappedComps.join('\n');
							})
							.join('\n');

						const dashboardPagesComponentsUser =
							availableDashboardPages.user
								?.map(({ pageBodyComponent, pageActionsComponent, ...item }) => {
									const components: Record<string, string> = {
										pageBodyComponent,
									};

									if (item.sidebar === 'double') {
										components.innerSidebarComponent = item.innerSidebarComponent;
									}

									if (pageActionsComponent) {
										components.pageActionsComponent = pageActionsComponent;
									}

									const remappedComps = Object.entries(components).map(
										([key, value]) =>
											`export { default as ${convertToSafeString(item.title + key)} } from '${value}';`
									);

									return remappedComps.join('\n');
								})
								.join('\n') || '';

						const dashboardPagesComponentsAdmin =
							availableDashboardPages.admin
								?.map(({ pageBodyComponent, pageActionsComponent, ...item }) => {
									const components: Record<string, string> = {
										pageBodyComponent,
									};

									if (item.sidebar === 'double') {
										components.innerSidebarComponent = item.innerSidebarComponent;
									}

									if (pageActionsComponent) {
										components.pageActionsComponent = pageActionsComponent;
									}

									const remappedComps = Object.entries(components).map(
										([key, value]) =>
											`export { default as ${convertToSafeString(item.title + key)} } from '${value}';`
									);

									return remappedComps.join('\n');
								})
								.join('\n') || '';

						addVirtualImports(params, {
							name,
							imports: {
								'virtual:studiocms/components/Editors': `
									export const editorKeys = ${JSON.stringify([...editorKeys])};
									${editorComponents}
								`,

								'studiocms:sdk/cache': `
									export * from '${resolve('./sdk/cache.js')}';
									import studioCMS_SDK_Cache from '${resolve('./sdk/cache.js')}';
									export default studioCMS_SDK_Cache;
								`,

								// User Virtual Components
								'studiocms:component-proxy': `
									export const componentKeys = ${JSON.stringify(componentKeys || [])};
									${components}
								`,

								// Dashboard Grid Items
								'studiocms:components/dashboard-grid-components': `
									${dashboardGridComponents}
								`,
								'studiocms:components/dashboard-grid-items': `
									import * as components from 'studiocms:components/dashboard-grid-components';
	
									const currentComponents = ${JSON.stringify(availableDashboardGridItems)};
	
									const dashboardGridItems = currentComponents.map((item) => {
										const gridItem = { ...item };
	
										if (gridItem.body?.components) {
											gridItem.body.components = Object.entries(gridItem.body.components).reduce(
												(acc, [key, value]) => ({
													...acc,
													[key]: components[key],
												}),
												{}
											);
										}
	
										return gridItem;
									});
	
									export default dashboardGridItems;
								`,

								// Dashboard Pages
								'studiocms:plugins/dashboard-pages/components/user': `
									${dashboardPagesComponentsUser}
								`,
								'studiocms:plugins/dashboard-pages/user': `
									import { convertToSafeString } from '${resolve('./utils/safeString.js')}';
									import * as components from 'studiocms:plugins/dashboard-pages/components/user';
	
									const currentComponents = ${JSON.stringify(availableDashboardPages.user || [])};
	
									const dashboardPages = currentComponents.map((item) => {
										const page = { 
											...item,
											components: {
												PageBodyComponent: components[convertToSafeString(item.title + 'pageBodyComponent')],
												PageActionsComponent: components[convertToSafeString(item.title + 'pageActionsComponent')] || null,
												InnerSidebarComponent: item.sidebar === 'double' ? components[convertToSafeString(item.title + 'innerSidebarComponent')] || null : null,
											},
										};
	
										return page;
									});
	
									export default dashboardPages;
								`,

								'studiocms:plugins/dashboard-pages/components/admin': `
									${dashboardPagesComponentsAdmin}
								`,
								'studiocms:plugins/dashboard-pages/admin': `
									import { convertToSafeString } from '${resolve('./utils/safeString.js')}';
									import * as components from 'studiocms:plugins/dashboard-pages/components/admin';
	
									const currentComponents = ${JSON.stringify(availableDashboardPages.admin || [])};
	
									const dashboardPages = currentComponents.map((item) => {
										const page = { 
											...item,
											components: {
												PageBodyComponent: components[convertToSafeString(item.title + 'pageBodyComponent')],
												PageActionsComponent: components[convertToSafeString(item.title + 'pageActionsComponent')] || null,
												InnerSidebarComponent: item.sidebar === 'double' ? components[convertToSafeString(item.title + 'innerSidebarComponent')] || null : null,
											},
										};
	
										return page;
									});
	
									export default dashboardPages;
								`,

								'virtual:studiocms/plugins/endpoints': `
									${pluginEndpoints.map(({ apiEndpoint }) => apiEndpoint).join('\n')}

									${pluginSettingsEndpoints.map(({ apiEndpoint }) => apiEndpoint).join('\n')}
								`,

								'studiocms:plugins/endpoints': `
									import * as endpoints from 'virtual:studiocms/plugins/endpoints';

									const pluginEndpoints = ${JSON.stringify(
										pluginEndpoints.map(({ identifier, safeIdentifier }) => ({
											identifier,
											safeIdentifier,
										})) || []
									)};

									const pluginSettingsEndpoints = ${JSON.stringify(
										pluginSettingsEndpoints.map(({ identifier, safeIdentifier }) => ({
											identifier,
											safeIdentifier,
										})) || []
									)};

									export const apiEndpoints = pluginEndpoints.map(({ identifier, safeIdentifier }) => ({
										identifier,
										onCreate: endpoints[safeIdentifier + '_onCreate'] || null,
										onEdit: endpoints[safeIdentifier + '_onEdit'] || null,
										onDelete: endpoints[safeIdentifier + '_onDelete'] || null,
									}));

									export const settingsEndpoints = pluginSettingsEndpoints.map(({ identifier, safeIdentifier }) => ({
										identifier,
										onSave: endpoints[safeIdentifier + '_onSave'] || null,
									}));
								`,

								'virtual:studiocms/plugins/renderers': `
									${pluginRenderers ? pluginRenderers.map(({ content }) => content).join('\n') : ''}
								`,
								'studiocms:plugins/renderers': `
									import * as renderers from 'virtual:studiocms/plugins/renderers';
									export const pluginRenderers = ${JSON.stringify(
										pluginRenderers.map(({ pageType, safePageType }) => ({
											pageType,
											safePageType,
										})) || []
									)};

									export { preRender as mdPreRender } from '${resolve('./components/renderers/markdown-prerender.js')}';
								`,
							},
						});
					}

					// Update the Astro Config
					integrationLogger(
						logInfo,
						'Updating Astro Config with StudioCMS Resources and settings...'
					);
					updateConfig({
						experimental: {
							serializeConfig: true,
						},
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
							plugins: [inlineModPlugin()],
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
				},
				// CONFIG DONE: Inject the Markdown configuration into the shared state
				'astro:config:done': ({ config }) => {
					// Inject the Markdown configuration into the shared state
					shared.astroMDRemark = config.markdown;
					shared.studiocmsHTML = options.pageTypeOptions.html;
					if (options.pageTypeOptions.markdown.flavor === 'studiocms') {
						shared.studiocmsMarkdown = options.pageTypeOptions.markdown;
					} else {
						shared.studiocmsMarkdown = {
							...StudioCMSMarkdownDefaults,
							sanitize: options.pageTypeOptions.markdown.sanitize,
						};
					}

					// Log Setup Complete
					messages.push({
						label: 'studiocms:setup',
						logLevel: 'info',
						message: 'Setup Complete. 🚀',
					});
				},
				// DEV SERVER: Check for updates on server start and log messages
				'astro:server:start': async ({ logger: l }) => {
					const logger = l.fork(`${name}:update-check`);

					try {
						const { version: latestVersion } = await packageJson(name.toLowerCase());

						const comparison = semCompare(pkgVersion, latestVersion);

						if (comparison === -1) {
							logger.warn(
								`A new version of '${name}' is available. Please update to ${latestVersion} using your favorite package manager.`
							);
						} else if (comparison === 0) {
							logger.info(`You are using the latest version of '${name}' (${pkgVersion})`);
						} else {
							logger.info(
								`You are using a newer version (${pkgVersion}) of '${name}' than the latest release (${latestVersion})`
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

					if (options.dashboardConfig.developerConfig.demoMode !== false) {
						integrationLogger(
							{ logger, logLevel: 'info', verbose: true },
							'Demo Mode is Enabled. This means that the StudioCMS Dashboard will be available to the public using the provided credentials and the REST API has been disabled. To disable Demo Mode, set the `demoMode` option to `false` or remove the option in your StudioCMS configuration.'
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

					if (options.dashboardConfig.developerConfig.demoMode !== false) {
						integrationLogger(
							{ logger, logLevel: 'info', verbose: true },
							'Demo Mode is Enabled. This means that the StudioCMS Dashboard will be available to the public using the provided credentials and the REST API has been disabled. To disable Demo Mode, set the `demoMode` option to `false` or remove the option in your StudioCMS configuration.'
						);
					}
				},
			},
		};
	},
});

export default studiocms;
