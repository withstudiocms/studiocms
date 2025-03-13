import { createResolver } from 'astro-integration-kit';
import type { TimeString } from './schemas/config/sdk.js';

const { resolve } = createResolver(import.meta.url);

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
const _routes_dir = (path: string) => resolve(`./routes/${path}`);

const __temp = (path: string) => `studiocms/src/routes/${path}`;

/**
 * REST API Directory Resolver
 */
const _rest_dir = (version: CurrentRESTAPIVersions) => (file: string) =>
	__temp(`rest/${version}/${file}`);

/**
 * REST API Directory
 */
export const routesDir = {
	fts: (file: string) => __temp(`firstTimeSetupRoutes/${file}`),
	dashRoute: (file: string) => __temp(`dashboard/${file}`),
	dashApi: (file: string) => __temp(`dashboard/studiocms_api/dashboard/${file}`),
	errors: (file: string) => __temp(`error-pages/${file}`),
	v1Rest: (file: string) => _rest_dir('v1')(file),
	sdk: (file: string) => __temp(`sdk/${file}`),
	api: (file: string) => __temp(`api/${file}`),
	authPage: (file: string) => __temp(`auth/${file}`),
	authAPI: (file: string) => __temp(`auth/api/${file}`),
	mailer: (file: string) => __temp(`mailer/${file}`),
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
