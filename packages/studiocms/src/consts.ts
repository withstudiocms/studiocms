import type { AstroConfig } from 'astro';
import { makeAPIRoute, removeLeadingTrailingSlashes } from './lib/index.js';
import type { TimeString } from './schemas/config/sdk.js';

/**
 * StudioCMS Site Config Table Entry ID
 */
export const CMSSiteConfigId: number = 1;

/**
 * StudioCMS Mailer Config Table Entry ID
 */
export const CMSMailerConfigId: string = '1';

/**
 * StudioCMS Notification Settings Table Entry ID
 */
export const CMSNotificationSettingsId: string = '1';

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
};

/**
 * StudioCMS Social Links
 */
export const studioCMSSocials: StudioCMSSocials = {
	github: 'https://github.com/withstudiocms/studiocms',
	githubLicense: 'https://github.com/withstudiocms/studiocms?tab=MIT-1-ov-file#readme',
	githubContributors: 'https://github.com/withstudiocms/studiocms/graphs/contributors',
	discord: 'https://chat.studiocms.dev',
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
	id: CMSNotificationSettingsId,
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
export const makeDashboardRoute = (route?: string | undefined) => {
	let defaultRoute = 'dashboard';

	if (route) defaultRoute = removeLeadingTrailingSlashes(route);

	if (route === '/') defaultRoute = '';

	return (path: string) => `${defaultRoute}/${path}`;
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

export const AstroConfigViteSettings: Partial<AstroConfig['vite']> = {
	optimizeDeps: {
		exclude: ['three'],
	},
};
