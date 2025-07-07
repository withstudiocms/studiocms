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
const _routes_dir = (path: string) => `studiocms/src/routes/${path}`;

/**
 * REST API Directory Resolver
 */
const _rest_dir = (version: CurrentRESTAPIVersions) => (file: string) =>
	_routes_dir(`rest/${version}/${file}`);

/**
 * REST API Directory
 */
export const routesDir = {
	fts: (file: string) => _routes_dir(`firstTimeSetupRoutes/${file}`),
	dashRoute: (file: string) => _routes_dir(`dashboard/${file}`),
	dashApi: (file: string) => _routes_dir(`api/dashboard/${file}`),
	errors: (file: string) => _routes_dir(`error-pages/${file}`),
	v1Rest: (file: string) => _rest_dir('v1')(file),
	sdk: (file: string) => _routes_dir(`sdk/${file}`),
	api: (file: string) => _routes_dir(`api/${file}`),
	authPage: (file: string) => _routes_dir(`auth/${file}`),
	authAPI: (file: string) => _routes_dir(`api/auth/${file}`),
	mailer: (file: string) => _routes_dir(`mailer/${file}`),
	middleware: (file: string) => `studiocms/src/middleware/${file}`,
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

export const dashboardAPIRoute = makeAPIRoute('dashboard');

export const authAPIRoute = makeAPIRoute('auth');

export const makeDashboardRoute = (route?: string | undefined) => {
	let defaultRoute = 'dashboard';

	if (route) defaultRoute = removeLeadingTrailingSlashes(route);

	if (route === '/') defaultRoute = '';

	return (path: string) => `${defaultRoute}/${path}`;
};

export const StudioCMSMarkdownDefaults = {
	flavor: 'studiocms' as const,
	autoLinkHeadings: false,
	callouts: false as const,
	discordSubtext: false,
};
