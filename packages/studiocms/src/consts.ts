import type { TimeString } from './schemas/config/sdk.js';

/**
 * StudioCMS Site Config Table Entry ID
 */
export const CMSSiteConfigId: number = 1;

/**
 * The default lifetime for cached items.
 * This value is used to determine how long an item should remain in the cache before it is considered expired.
 * This value is used in ./schemas/config/sdk.ts to set the default cache lifetime.
 */
export const defaultCacheLifeTime: TimeString = '5m';

/**
 * The default lifetime for cached items in milliseconds.
 * This value is used to determine how long an item should remain in the cache before it is considered expired.
 */
export const versionCacheLifetime = 1000 * 60 * 60 * 24 * 7; // 1 week

/**
 * Current REST API Versions
 */
export const currentRESTAPIVersions = ['v1'] as const;

/**
 * Current REST API Versions Type
 */
export type CurrentRESTAPIVersions = (typeof currentRESTAPIVersions)[number];

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

export const GhostUserDefaults = {
	id: '_StudioCMS_Ghost_User_',
	name: 'Ghost (deleted user)',
	username: 'studiocms_ghost_user',
	avatar: 'https://seccdn.libravatar.org/static/img/mm/80.png',
};
