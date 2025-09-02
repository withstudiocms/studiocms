import { icons as flatColorIcons } from '@iconify-json/flat-color-icons';
import { icons as simpleIcons } from '@iconify-json/simple-icons';
import type uiIntegration from '@studiocms/ui';
import {
	type AvailablePermissionRanks,
	availablePermissionRanks,
} from '@withstudiocms/auth-kit/types';
import type { AstroConfig } from 'astro';
import type { RobotsConfig } from './integrations/robots/schema.js';
import type { TimeString } from './schemas/config/sdk.js';
import { stripIconify } from './utils/stripIconify.js';
import { makeAPIRoute } from './virtuals/lib/makeAPIRoute.js';
import { stripLeadingAndTrailingSlashes } from './virtuals/lib/pathGenerators.js';

/**
 * StudioCMS Site Config Table Entry ID
 */
export const CMSSiteConfigId: number = 1;

export const Next_SiteConfigId: string = 'SCMS_SITE_CONFIG_1';

/**
 * StudioCMS Mailer Config Table Entry ID
 */
export const CMSMailerConfigId: string = '1';

export const Next_MailerConfigId: string = 'SCMS_MAILER_CONFIG_1';

/**
 * StudioCMS Notification Settings Table Entry ID
 */
export const CMSNotificationSettingsId: string = '1';

export const Next_NotificationSettingsId: string = 'SCMS_NOTIFICATION_SETTINGS_1';

/**
 * The default lifetime for cached items.
 * This value is used to determine how long an item should remain in the cache before it is considered expired.
 * This value is used in ./schemas/config/sdk.ts to set the default cache lifetime.
 */
export const defaultCacheLifeTime: TimeString = '5m';

/**
 * Utility Constant for One Day in Milliseconds
 *
 * This is used for the `versionCacheLifetime` constant.
 */
const OneDay = 1000 * 60 * 60 * 24;

/**
 * The default lifetime for cached items in milliseconds.
 * This value is used to determine how long an item should remain in the cache before it is considered expired.
 */
export const versionCacheLifetime = OneDay * 7; // 1 week

/**
 * Current REST API Versions
 */
export const currentRESTAPIVersions = ['v1'] as const;

/**
 * Current REST API Versions Type
 */
export type CurrentRESTAPIVersions = (typeof currentRESTAPIVersions)[number];

/**
 * Routes Directory Resolver
 */
const baseDir = (path: string) => `studiocms/src/${path}`;

/**
 * Base Directory Functions
 */
const baseRoutesDir = (path: string) => baseDir(`routes/${path}`);

/**
 * Base Directory Functions for Middleware
 */
const baseMiddlewareDir = (path: string) => baseDir(`middleware/${path}`);

/**
 * Base Directory Functions for API Routes
 */
const baseAPIRoutesDir = (path: string) => baseRoutesDir(`api/${path}`);

/**
 * Base Directory Functions for REST API Routes
 */
const baseRestDir = (version: CurrentRESTAPIVersions) => (path: string) =>
	baseRoutesDir(`api/rest/${version}/${path}`);

/**
 * REST API Directory
 */
export const routesDir = {
	// Main Routes
	fts: (file: string) => baseRoutesDir(`firstTimeSetupRoutes/${file}`),
	dashRoute: (file: string) => baseRoutesDir(`dashboard/${file}`),
	errors: (file: string) => baseRoutesDir(`error-pages/${file}`),
	authPage: (file: string) => baseRoutesDir(`auth/${file}`),

	// API Routes
	dashApi: (file: string) => baseAPIRoutesDir(`dashboard/${file}`),
	authAPI: (file: string) => baseAPIRoutesDir(`auth/${file}`),
	api: (file: string) => baseAPIRoutesDir(file),
	sdk: (file: string) => baseAPIRoutesDir(`sdk/${file}`),
	mailer: (file: string) => baseAPIRoutesDir(`mailer/${file}`),

	// REST API Routes
	v1Rest: (file: string) => baseRestDir('v1')(file),

	// Middleware
	middleware: (file: string) => baseMiddlewareDir(file),
};

/**
 * StudioCMS Social Links Type
 */
export type StudioCMSSocials = {
	github: string;
	githubLicense: string;
	githubContributors: string;
	discord: string;
	changelog: string;
	releases: string;
	npm: string;
};

/**
 * StudioCMS Social Links
 */
export const studioCMSSocials: StudioCMSSocials = {
	github: 'https://github.com/withstudiocms/studiocms',
	githubLicense: 'https://github.com/withstudiocms/studiocms/blob/main/packages/studiocms/LICENSE',
	githubContributors: 'https://github.com/withstudiocms/studiocms/graphs/contributors',
	discord: 'https://chat.studiocms.dev',
	changelog: 'https://github.com/withstudiocms/studiocms/blob/main/packages/studiocms/CHANGELOG.md',
	releases: 'https://github.com/withstudiocms/studiocms/releases',
	npm: 'https://npm.im/studiocms',
};

/**
 * Default values for a "ghost" user in StudioCMS.
 * This user represents a deleted user in the system.
 */
export const GhostUserDefaults = {
	id: '_StudioCMS_Ghost_User_',
	name: 'Ghost (deleted user)',
	username: 'studiocms_ghost_user',
	avatar: 'https://seccdn.libravatar.org/static/img/mm/80.png',
};

/**
 * Default values for the site Notifications configuration.
 */
export const NotificationSettingsDefaults = {
	emailVerification: false,
	oAuthBypassVerification: false,
	requireEditorVerification: false,
	requireAdminVerification: false,
};

/**
 * Creates a standardized API route path for the dashboard.
 *
 * @param route - Optional additional path to append to the base dashboard API route.
 * @returns A function that constructs the full API route path.
 */
export const dashboardAPIRoute = makeAPIRoute('dashboard');

/**
 * Creates a standardized API route path for authentication-related endpoints.
 *
 * @returns A function that constructs the full API route path for authentication.
 */
export const authAPIRoute = makeAPIRoute('auth');

/**
 * Creates a standardized API route path for the SDK.
 *
 * @returns A function that constructs the full API route path for the SDK.
 */
export const makeDashboardRoute = (route?: string) => {
	const sanitized = route === '/' ? '' : stripLeadingAndTrailingSlashes(route ?? 'dashboard');
	return (path: string) => `${sanitized}/${path}`;
};

/**
 * Default values for the StudioCMS Markdown configuration.
 * This configuration is used to set up the default behavior of Markdown rendering in StudioCMS.
 */
export const StudioCMSMarkdownDefaults = {
	flavor: 'studiocms' as const,
	autoLinkHeadings: false,
	callouts: false as const,
	discordSubtext: false,
};

/**
 * Partial configuration object for Astro's image settings.
 *
 * This constant defines allowed remote image patterns for Astro,
 * specifying that images can be loaded from both 'https' and 'http' protocols.
 *
 * @remarks
 * This is a partial type of `AstroConfig['image']`, so it can be merged with other image settings.
 *
 * @example
 * // Usage in Astro config
 * import { AstroConfigImageSettings } from './consts';
 * export default {
 *   image: {
 *     ...AstroConfigImageSettings,
 *     // other image settings
 *   }
 * }
 */
export const AstroConfigImageSettings: Partial<AstroConfig['image']> = {
	remotePatterns: [
		{
			protocol: 'https',
		},
		{
			protocol: 'http',
		},
	],
};

/**
 * Partial Vite configuration settings for Astro projects.
 *
 * This constant customizes the Vite settings used by Astro, specifically
 * excluding the 'three' package from dependency optimization. This can be
 * useful if 'three' causes issues during Vite's dependency pre-bundling.
 *
 * @remarks
 * The type is a partial of the 'vite' property from the Astro configuration,
 * allowing you to override or extend only the necessary Vite options.
 *
 * @see https://docs.astro.build/en/reference/configuration-reference/#vite
 */
export const AstroConfigViteSettings: Partial<AstroConfig['vite']> = {
	build: {
		chunkSizeWarningLimit: 700,
	},
};

/**
 * Generates the default robots.txt configuration for StudioCMS.
 *
 * @param config - The Astro site configuration object.
 * @param sitemapEnabled - Indicates whether the sitemap should be enabled.
 * @param dashboardRoute - A function that returns the dashboard route path given a base path.
 * @returns The robots.txt configuration object.
 */
export const StudioCMSDefaultRobotsConfig = ({
	config,
	sitemapEnabled,
	dashboardRoute,
}: {
	config: AstroConfig;
	sitemapEnabled: boolean;
	dashboardRoute: (path: string) => string;
}): RobotsConfig => {
	// Extract the host from the site URL in the Astro config.
	// If the site URL is not set or invalid, default to false.
	let host: string | false = false;
	if (config.site) {
		try {
			const url = new URL(config.site);
			host = url.hostname;
		} catch {
			// Fallback to regex approach
			host = config.site.replace(/^https?:\/\/|:\d+$/g, '') || false;
		}
	}

	// Return the robots.txt configuration object.
	return {
		host,
		sitemap: sitemapEnabled,
		policy: [
			{
				userAgent: ['*'],
				allow: ['/'],
				disallow: [dashboardRoute(''), '/studiocms_api/'],
			},
		],
	};
};

export const STUDIOCMS_EDITOR_CSRF_COOKIE_NAME = 'studiocms-editor-csrf-token';

export const STUDIOCMS_THEME_COLOR = '#a581f3';

export const STUDIOCMS_CDN_URL = 'https://cdn.studiocms.dev';

export const FAVICON_ASSETS = {
	svg: `${STUDIOCMS_CDN_URL}/favicon.svg`,
	png: {
		light: `${STUDIOCMS_CDN_URL}/favicon-light.png`,
		dark: `${STUDIOCMS_CDN_URL}/favicon-dark.png`,
	},
} as const;

type UiOptions = Parameters<typeof uiIntegration>[0];

/**
 * UI options configuration for StudioCMS.
 *
 * @remarks
 * This constant defines the default UI options used throughout StudioCMS.
 * It includes settings for CSS injection and icon sets.
 *
 * @property noInjectCSS - If true, StudioCMS UI will not inject its default CSS into all routes.
 * @property icons - An object containing icon sets used in the UI.
 *   - `flatcoloricons`: Contains selected icons from the Flat Color Icons set (e.g., 'google').
 *   - `simpleicons`: Contains selected icons from the Simple Icons set (e.g., 'github', 'discord', 'auth0').
 */
export const STUDIOCMS_UI_OPTS: UiOptions = {
	noInjectCSS: true,
	icons: {
		flatcoloricons: stripIconify({
			src: flatColorIcons,
			icons: ['google'],
		}),
		simpleicons: stripIconify({
			src: simpleIcons,
			icons: ['github', 'discord', 'auth0'],
		}),
	},
};

/**
 * Merges user-provided UI options with default StudioCMS UI options.
 *
 * @param userOpts - An optional partial object containing user-specified UI options.
 * @returns The merged UI options object.
 *
 * @remarks
 * - If a user option is provided, it takes precedence over the default.
 * - The `icons` property is deeply merged, combining default and user-provided icons.
 */
export function getUiOpts(userOpts?: Partial<UiOptions>): UiOptions {
	const base = { ...STUDIOCMS_UI_OPTS };
	const merged: UiOptions = {
		...base,
		...userOpts,
		icons: userOpts?.icons ? { ...base.icons, ...userOpts.icons } : base.icons,
	};
	return merged;
}

export const LinkNewOAuthCookieName = 'link-new-o-auth';
export const AuthSessionCookieName = 'auth_session';

export const ValidRanks: ReadonlySet<AvailablePermissionRanks> = new Set(availablePermissionRanks);
