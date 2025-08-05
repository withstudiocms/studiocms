import type {
	tsDiffTracking,
	tsEmailVerificationTokens,
	tsNotificationSettings,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsPluginData,
	tsSessionTable,
	tsSiteConfig,
	tsUserResetTokens,
	tsUsers,
} from '../tables.js';

/**
 * Type representing the structure of plugin data in the database when inserting new data.
 */
export type tsPluginDataInsert = typeof tsPluginData.$inferInsert;

/**
 * Type representing the structure of plugin data in the database when selecting existing data.
 */
export type tsPluginDataSelect = typeof tsPluginData.$inferSelect;

/**
 * Represents the selected fields from the `tsEmailVerificationTokens` table.
 * This type is inferred from the select query on the `tsEmailVerificationTokens` model.
 */
export type tsEmailVerificationTokensSelect = typeof tsEmailVerificationTokens.$inferSelect;

/**
 * Represents the type used for inserting new email verification tokens into the database.
 * This type is inferred from the structure of the `tsEmailVerificationTokens` table.
 */
export type tsEmailVerificationTokensInsert = typeof tsEmailVerificationTokens.$inferInsert;

/**
 * Represents the type used for inserting new notification settings into the database.
 * Derived from the insert-able fields of the `tsNotificationSettings` table schema.
 */
export type tsNotificationSettingsInsert = typeof tsNotificationSettings.$inferInsert;

/**
 * Represents the selected fields of the `tsNotificationSettings` table.
 * This type is inferred from the select query on the `tsNotificationSettings` table.
 */
export type tsNotificationSettingsSelect = typeof tsNotificationSettings.$inferSelect;

/**
 * Represents the type used for inserting new records into the `tsUserResetTokens` table.
 * This type is inferred from the structure of the table and includes all required fields for insertion.
 */
export type tsUserResetTokensInsert = typeof tsUserResetTokens.$inferInsert;

/**
 * Represents the selected fields from the `tsUserResetTokens` table.
 *
 * This type is inferred from the select query on the `tsUserResetTokens` table,
 * and includes only the fields that are selected.
 */
export type tsUserResetTokensSelect = typeof tsUserResetTokens.$inferSelect;

/**
 * Type alias for the inferred select type of `tsPageFolderStructure`.
 *
 * This type is derived from the `$inferSelect` property of `tsPageFolderStructure`.
 * It represents the structure of data that can be selected from the folder structure.
 */
export type tsPageFolderSelect = typeof tsPageFolderStructure.$inferSelect;

/**
 * Type alias for the inferred insert type of `tsPageFolderStructure`.
 *
 * This type is derived from the `$inferInsert` property of `tsPageFolderStructure`.
 * It represents the structure of data that can be inserted into the folder structure.
 */
export type tsPageFolderInsert = typeof tsPageFolderStructure.$inferInsert;

/**
 * Type alias for the inferred select type of `tsUsers`.
 *
 * This type is derived from the `$inferSelect` property of `tsUsers`.
 * It represents the shape of the data that will be selected from the `tsUsers` object.
 */
export type tsUsersSelect = typeof tsUsers.$inferSelect;

/**
 * Type alias for inserting users.
 *
 * This type is inferred from the `tsUsers` object, specifically its `$inferInsert` property.
 * It represents the structure of data required to insert a new user into the system.
 */
export type tsUsersInsert = typeof tsUsers.$inferInsert;

/**
 * Represents a type for updating users, where all properties are optional.
 * This type is a partial version of the `tsUsersInsert` type.
 */
export type tsUsersUpdate = Partial<tsUsersInsert>;

/**
 * Type alias for the inferred select type of the `tsOAuthAccounts` object.
 *
 * This type is derived from the `$inferSelect` property of the `tsOAuthAccounts` object,
 * which is used to infer the shape of the selected data from the OAuth accounts.
 */
export type tsOAuthAccountsSelect = typeof tsOAuthAccounts.$inferSelect;

export type tsOAuthAccountsInsert = typeof tsOAuthAccounts.$inferInsert;

/**
 * Type alias for the inferred select type of the `tsSessionTable`.
 *
 * This type is derived from the `$inferSelect` property of the `tsSessionTable` object,
 * which represents the structure of a selected row from the `tsSessionTable`.
 */
export type tsSessionTableSelect = typeof tsSessionTable.$inferSelect;

/**
 * Type alias for the inferred insert type of the `tsSessionTable`.
 *
 * This type is derived from the `$inferInsert` property of the `tsSessionTable` object,
 * which represents the structure of data that can be inserted into the session table.
 */
export type tsSessionTableInsert = typeof tsSessionTable.$inferInsert;

/**
 * Type alias for the inferred select type of `tsPermissions`.
 *
 * This type is derived from the `$inferSelect` property of `tsPermissions`.
 * It is used to represent the shape of the data that can be selected from `tsPermissions`.
 */
export type tsPermissionsSelect = typeof tsPermissions.$inferSelect;

/**
 * Type alias for inserting permissions.
 *
 * This type is inferred from the `tsPermissions` object, specifically its `$inferInsert` property.
 * It represents the structure of data required to insert new permissions.
 */
export type tsPermissionsInsert = typeof tsPermissions.$inferInsert;

/**
 * Type alias for the inferred select type of `tsPageData`.
 *
 * This type is derived from the `$inferSelect` property of `tsPageData`.
 */
export type tsPageDataSelect = typeof tsPageData.$inferSelect;

/**
 * Type representing the selection of tags from the `tsPageDataTags` object.
 *
 * This type is inferred from the `$inferSelect` property of the `tsPageDataTags` object.
 */
export type tsPageDataTagsSelect = typeof tsPageDataTags.$inferSelect;

/**
 * Type representing the selection of page data categories.
 *
 * This type is inferred from the `tsPageDataCategories` object using the `$inferSelect` property.
 */
export type tsPageDataCategoriesSelect = typeof tsPageDataCategories.$inferSelect;

/**
 * Type alias for the inferred select type of `tsDiffTracking`.
 *
 * This type is derived from the `$inferSelect` property of `tsDiffTracking`.
 */
export type tsDiffTrackingSelect = typeof tsDiffTracking.$inferSelect;

/**
 * Type alias for the inferred Insert type of `tsDiffTracking`.
 *
 * This type is derived from the `$inferInsert` property of `tsDiffTracking`.
 */
export type tsDiffTrackingInsert = typeof tsDiffTracking.$inferInsert;

/**
 * Type alias for the inferred select type of `tsPageContent`.
 *
 * This type is derived from the `$inferSelect` property of `tsPageContent`.
 * It is used to represent the structure of the selected content from `tsPageContent`.
 */
export type tsPageContentSelect = typeof tsPageContent.$inferSelect;

/**
 * Type representing the selection of site configuration data.
 *
 * This type is inferred from the `$inferSelect` property of the `tsSiteConfig` object.
 */
export type tsSiteConfigSelect = typeof tsSiteConfig.$inferSelect;

/**
 * Type representing the insertion of site configuration data.
 *
 * This type is inferred from the `$inferInsert` property of the `tsSiteConfig` object.
 */
export type tsSiteConfigInsert = typeof tsSiteConfig.$inferInsert;

/**
 * Type alias for the inferred insert type of `tsPageData`.
 *
 * This type is derived from the `$inferInsert` property of `tsPageData`.
 * It represents the shape of data that can be inserted into the `tsPageData` structure.
 */
export type tsPageDataInsert = typeof tsPageData.$inferInsert;

/**
 * Type alias for the inferred insert type of `tsPageContent`.
 *
 * This type is derived from the `$inferInsert` property of `tsPageContent`.
 * It represents the structure of data that can be inserted into the `tsPageContent`.
 */
export type tsPageContentInsert = typeof tsPageContent.$inferInsert;

/**
 * Represents a type that combines the properties of `tsPageContentInsert`
 * excluding 'id' and 'contentId'.
 *
 * This type is useful when you need to insert content without specifying
 * the 'id' and 'contentId' fields, which might be auto-generated or
 * handled separately.
 */
export type CombinedInsertContent = Omit<tsPageContentSelect, 'id' | 'contentId'>;

/**
 * Type alias for the inferred insert type of `tsPageDataTags`.
 *
 * This type is derived from the `$inferInsert` property of `tsPageDataTags`.
 * It represents the shape of data that can be inserted into the `tsPageDataTags` table.
 */
export type tsPageDataTagsInsert = typeof tsPageDataTags.$inferInsert;

/**
 * Type alias for the inferred insert type of `tsPageDataCategories`.
 *
 * This type is derived from the `$inferInsert` property of `tsPageDataCategories`.
 * It represents the structure of data that can be inserted into the `tsPageDataCategories` table.
 */
export type tsPageDataCategoriesInsert = typeof tsPageDataCategories.$inferInsert;
