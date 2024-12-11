import type {
	tsDiffTracking,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsSessionTable,
	tsSiteConfig,
	tsUsers,
} from '../tables';

/**
 * Type alias for the inferred select type of `tsUsers`.
 *
 * This type is derived from the `$inferSelect` property of `tsUsers`.
 * It represents the shape of the data that will be selected from the `tsUsers` object.
 */
export type tsUsersSelect = typeof tsUsers.$inferSelect;

export type tsUsersInsert = typeof tsUsers.$inferInsert;

/**
 * Type alias for the inferred select type of the `tsOAuthAccounts` object.
 *
 * This type is derived from the `$inferSelect` property of the `tsOAuthAccounts` object,
 * which is used to infer the shape of the selected data from the OAuth accounts.
 */
export type tsOAuthAccountsSelect = typeof tsOAuthAccounts.$inferSelect;

/**
 * Type alias for the inferred select type of the `tsSessionTable`.
 *
 * This type is derived from the `$inferSelect` property of the `tsSessionTable` object,
 * which represents the structure of a selected row from the `tsSessionTable`.
 */
export type tsSessionTableSelect = typeof tsSessionTable.$inferSelect;

export type tsSessionTableInsert = typeof tsSessionTable.$inferInsert;

/**
 * Type alias for the inferred select type of `tsPermissions`.
 *
 * This type is derived from the `$inferSelect` property of `tsPermissions`.
 * It is used to represent the shape of the data that can be selected from `tsPermissions`.
 */
export type tsPermissionsSelect = typeof tsPermissions.$inferSelect;

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

export type CombinedInsertContent = Omit<tsPageContentInsert, 'id' | 'contentId'>;

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
