import {
	StudioCMSAPIKeys,
	StudioCMSDiffTracking,
	StudioCMSDynamicConfigSettings,
	StudioCMSEmailVerificationTokens,
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPageFolderStructure,
	StudioCMSPermissions,
	StudioCMSPluginData,
	StudioCMSSessionTable,
	StudioCMSUserResetTokens,
	StudioCMSUsers,
} from 'astro:db';
import type { Insertable } from '@withstudiocms/kysely/kysely';
import type { StudioCMSDatabaseSchema } from '@withstudiocms/kysely/tables';

const AstroDBTableSchema = {
	StudioCMSAPIKeys,
	StudioCMSDiffTracking,
	StudioCMSDynamicConfigSettings,
	StudioCMSEmailVerificationTokens,
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPageFolderStructure,
	StudioCMSPermissions,
	StudioCMSPluginData,
	StudioCMSSessionTable,
	StudioCMSUserResetTokens,
	StudioCMSUsers,
};

type AstroDBTableKeys = keyof typeof AstroDBTableSchema;

/**
 * Mapping from AstroDB table names to Kysely table names for StudioCMS.
 */
export const astroDBToKyselyMap: Record<AstroDBTableKeys, keyof StudioCMSDatabaseSchema> = {
	StudioCMSAPIKeys: 'StudioCMSAPIKeys',
	StudioCMSDiffTracking: 'StudioCMSDiffTracking',
	StudioCMSDynamicConfigSettings: 'StudioCMSDynamicConfigSettings',
	StudioCMSEmailVerificationTokens: 'StudioCMSEmailVerificationTokens',
	StudioCMSOAuthAccounts: 'StudioCMSOAuthAccounts',
	StudioCMSPageContent: 'StudioCMSPageContent',
	StudioCMSPageData: 'StudioCMSPageData',
	StudioCMSPageDataCategories: 'StudioCMSPageDataCategories',
	StudioCMSPageDataTags: 'StudioCMSPageDataTags',
	StudioCMSPageFolderStructure: 'StudioCMSPageFolderStructure',
	StudioCMSPermissions: 'StudioCMSPermissions',
	StudioCMSPluginData: 'StudioCMSPluginData',
	StudioCMSSessionTable: 'StudioCMSSessionTable',
	StudioCMSUserResetTokens: 'StudioCMSUserResetTokens',
	StudioCMSUsers: 'StudioCMSUsersTable',
};

export type AstroDBTableType<T extends AstroDBTableKeys> =
	(typeof AstroDBTableSchema)[T]['$inferSelect'];

export type KyselyTableType<T extends keyof StudioCMSDatabaseSchema> = Insertable<
	StudioCMSDatabaseSchema[T]
>;

type _exampleAstroDB = AstroDBTableType<'StudioCMSUsers'>;
type _exampleKyselyDB = KyselyTableType<'StudioCMSUsersTable'>;
