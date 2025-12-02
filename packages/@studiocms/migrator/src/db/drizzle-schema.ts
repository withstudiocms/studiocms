import { asDrizzleTable } from '../lib/astro-db-drizzle-compat/index.js';
import * as Schema from './astro-db-schema.js';

export const StudioCMSUsers = asDrizzleTable('StudioCMSUsers', Schema.StudioCMSUsers);
export const StudioCMSPageData = asDrizzleTable('StudioCMSPageData', Schema.StudioCMSPageData);
export const StudioCMSPageFolderStructure = asDrizzleTable(
	'StudioCMSPageFolderStructure',
	Schema.StudioCMSPageFolderStructure
);
export const StudioCMSPageDataTags = asDrizzleTable(
	'StudioCMSPageDataTags',
	Schema.StudioCMSPageDataTags
);
export const StudioCMSPageDataCategories = asDrizzleTable(
	'StudioCMSPageDataCategories',
	Schema.StudioCMSPageDataCategories
);
export const StudioCMSPluginData = asDrizzleTable(
	'StudioCMSPluginData',
	Schema.StudioCMSPluginData
);
export const StudioCMSDynamicConfigSettings = asDrizzleTable(
	'StudioCMSDynamicConfigSettings',
	Schema.StudioCMSDynamicConfigSettings
);
export const StudioCMSAPIKeys = asDrizzleTable('StudioCMSAPIKeys', Schema.StudioCMSAPIKeys);
export const StudioCMSUserResetTokens = asDrizzleTable(
	'StudioCMSUserResetTokens',
	Schema.StudioCMSUserResetTokens
);
export const StudioCMSOAuthAccounts = asDrizzleTable(
	'StudioCMSOAuthAccounts',
	Schema.StudioCMSOAuthAccounts
);
export const StudioCMSSessionTable = asDrizzleTable(
	'StudioCMSSessionTable',
	Schema.StudioCMSSessionTable
);
export const StudioCMSPermissions = asDrizzleTable(
	'StudioCMSPermissions',
	Schema.StudioCMSPermissions
);
export const StudioCMSDiffTracking = asDrizzleTable(
	'StudioCMSDiffTracking',
	Schema.StudioCMSDiffTracking
);
export const StudioCMSPageContent = asDrizzleTable(
	'StudioCMSPageContent',
	Schema.StudioCMSPageContent
);
export const StudioCMSEmailVerificationTokens = asDrizzleTable(
	'StudioCMSEmailVerificationTokens',
	Schema.StudioCMSEmailVerificationTokens
);
