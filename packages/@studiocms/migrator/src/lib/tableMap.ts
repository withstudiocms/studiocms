import type { Insertable } from '@withstudiocms/kysely/kysely';
import {
	StudioCMSAPIKeys as KyselyStudioCMSAPIKeys,
	StudioCMSDiffTracking as KyselyStudioCMSDiffTracking,
	StudioCMSDynamicConfigSettings as KyselyStudioCMSDynamicConfigSettings,
	StudioCMSEmailVerificationTokens as KyselyStudioCMSEmailVerificationTokens,
	StudioCMSOAuthAccounts as KyselyStudioCMSOAuthAccounts,
	StudioCMSPageContent as KyselyStudioCMSPageContent,
	StudioCMSPageData as KyselyStudioCMSPageData,
	StudioCMSPageDataCategories as KyselyStudioCMSPageDataCategories,
	StudioCMSPageDataTags as KyselyStudioCMSPageDataTags,
	StudioCMSPageFolderStructure as KyselyStudioCMSPageFolderStructure,
	StudioCMSPermissions as KyselyStudioCMSPermissions,
	StudioCMSPluginData as KyselyStudioCMSPluginData,
	StudioCMSSessionTable as KyselyStudioCMSSessionTable,
	StudioCMSUserResetTokens as KyselyStudioCMSUserResetTokens,
	StudioCMSUsersTable as KyselyStudioCMSUsersTable,
} from '@withstudiocms/sdk/tables';
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
} from '../db/astro-db-drizzle-client.js';
import { getDataMigrationMeta as getAstroDataMigrationMeta } from '../db/astrodb.js';
import { getDataMigrationMeta as getKyselyDataMigrationMeta } from '../db/client.js';

/**
 * Schema definitions for AstroDB
 */
export const AstroDBTableSchema = {
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

/**
 * Schema definitions for Kysely
 */
export const KyselyTableSchema = {
	StudioCMSAPIKeys: KyselyStudioCMSAPIKeys,
	StudioCMSDiffTracking: KyselyStudioCMSDiffTracking,
	StudioCMSDynamicConfigSettings: KyselyStudioCMSDynamicConfigSettings,
	StudioCMSEmailVerificationTokens: KyselyStudioCMSEmailVerificationTokens,
	StudioCMSOAuthAccounts: KyselyStudioCMSOAuthAccounts,
	StudioCMSPageContent: KyselyStudioCMSPageContent,
	StudioCMSPageData: KyselyStudioCMSPageData,
	StudioCMSPageDataCategories: KyselyStudioCMSPageDataCategories,
	StudioCMSPageDataTags: KyselyStudioCMSPageDataTags,
	StudioCMSPageFolderStructure: KyselyStudioCMSPageFolderStructure,
	StudioCMSPermissions: KyselyStudioCMSPermissions,
	StudioCMSPluginData: KyselyStudioCMSPluginData,
	StudioCMSSessionTable: KyselyStudioCMSSessionTable,
	StudioCMSUserResetTokens: KyselyStudioCMSUserResetTokens,
	StudioCMSUsersTable: KyselyStudioCMSUsersTable,
};

// Get table keys

/**
 * Array of AstroDB table keys.
 */
export const astroDbTableKeys = Object.keys(AstroDBTableSchema) as Array<
	keyof typeof AstroDBTableSchema
>;

/**
 * Array of AstroDB table keys that have no references to other tables.
 */
export const tablesWithNoReferences = [
	'StudioCMSUsers',
	'StudioCMSPageData',
	'StudioCMSPageFolderStructure',
	'StudioCMSPageDataTags',
	'StudioCMSPageDataCategories',
	'StudioCMSPluginData',
	'StudioCMSDynamicConfigSettings',
] as const;

/**
 * Array of AstroDB table keys that have references to other tables.
 */
export const tablesWithReferences: Exclude<
	AstroDBTableKeys,
	(typeof tablesWithNoReferences)[number]
>[] = [
	'StudioCMSAPIKeys',
	'StudioCMSDiffTracking',
	'StudioCMSEmailVerificationTokens',
	'StudioCMSOAuthAccounts',
	'StudioCMSPageContent',
	'StudioCMSPermissions',
	'StudioCMSSessionTable',
	'StudioCMSUserResetTokens',
];

/**
 * Array of Kysely table keys.
 */
export const kyselyTableKeys = Object.keys(KyselyTableSchema) as Array<
	keyof typeof KyselyTableSchema
>;

// Define table key types
export type AstroDBTableKeys = (typeof astroDbTableKeys)[number];
export type KyselyTableKeys = (typeof kyselyTableKeys)[number];

/**
 * Mapping from AstroDB table names to Kysely table names for StudioCMS.
 */
export const astroDBToKyselyMap = {
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
} as const;

/**
 * Type representing the mapping from AstroDB table names to Kysely table names.
 */
export type AstroDBToKyselyMap = typeof astroDBToKyselyMap;

/**
 * Type representing the drizzle inferSelect type for a given AstroDB table.
 */
export type AstroDBTableType<T extends AstroDBTableKeys> =
	(typeof AstroDBTableSchema)[T]['$inferSelect'];

/**
 * Type representing the Kysely Insertable type for a given Kysely table.
 */
export type KyselyTableType<T extends KyselyTableKeys> = Insertable<
	(typeof KyselyTableSchema)[T]['Encoded']
>;

/**
 * Type representing the migration types for a given AstroDB table and its corresponding Kysely table.
 */
export type GetMigrationTypes<
	AstroDB extends AstroDBTableKeys,
	KyselyDB extends KyselyTableKeys = AstroDBToKyselyMap[AstroDB],
> = {
	astro: AstroDBTableType<AstroDB>;
	kysely: KyselyTableType<KyselyDB>;
};

/**
 * Type representing a migration Key pair between an AstroDB table and its corresponding Kysely table.
 */
export type MigrationPair = {
	astroTable: AstroDBTableKeys;
	kyselyTable: KyselyTableKeys;
};

/**
 * Get the migration key pair for a given AstroDB table key.
 *
 * @param key - The AstroDB table key.
 * @returns The migration key pair.
 */
export const getMigrationPairs = <T extends AstroDBTableKeys>(key: T): MigrationPair => {
	return {
		astroTable: key,
		kyselyTable: astroDBToKyselyMap[key],
	};
};

// type _exampleMapping = GetMigrationTypes<'StudioCMSUsers'>;
// const _examplePair = getMigrationPairs('StudioCMSUsers');

/**
 * Type representing migration metadata for both AstroDB and Kysely tables.
 */
export type MigrationMetaTables = {
	astro: {
		[key in AstroDBTableKeys]: number;
	};
	kysely: {
		[key in KyselyTableKeys]: number;
	};
};

/**
 * Retrieve migration metadata for both AstroDB and Kysely databases.
 *
 * @returns An object containing migration metadata for AstroDB and Kysely tables.
 */
export const migrationMeta = async (): Promise<MigrationMetaTables> => {
	const astro = await getAstroDataMigrationMeta().catch(() => {
		const emptyMeta = {} as { [key in AstroDBTableKeys]: number };
		return emptyMeta;
	});
	const kysely = await getKyselyDataMigrationMeta().catch(() => {
		const emptyMeta = {} as { [key in KyselyTableKeys]: number };
		return emptyMeta;
	});

	return {
		astro,
		kysely,
	};
};
