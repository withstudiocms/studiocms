import type {
	tsDiffTrackingSelect,
	tsOAuthAccountsSelect,
	tsPageContentSelect,
	tsPageDataCategoriesSelect,
	tsPageDataSelect,
	tsPageDataTagsSelect,
	tsPermissionsSelect,
	tsSessionTableSelect,
	tsSiteConfigSelect,
	tsUsersSelect,
} from './tsAlias.js';

/**
 * Represents a stripped-down version of the `tsSiteConfigSelect` type,
 * excluding the property 'id'.
 */
export type SiteConfig = Omit<tsSiteConfigSelect, 'id'>;

/**
 * Represents a stripped-down version of the `tsPageDataSelect` type,
 * excluding the properties 'categories', 'tags', and 'contributorIds'.
 */
export type PageDataStripped = Omit<tsPageDataSelect, 'categories' | 'tags' | 'contributorIds'>;

/**
 * Represents a type that picks the 'id' property from the tsPageContentSelect type.
 */
export type PageDataReturnId = Pick<tsPageContentSelect, 'id'>;

/**
 * Represents a type that picks the 'id' property from the tsPageDataSelect type.
 * This type is used to return only the 'id' field from a tsPageDataSelect object.
 */
export type PageContentReturnId = Pick<tsPageDataSelect, 'id'>;

/**
 * Represents the response type for inserting page data tags.
 * This type is a subset of `tsPageDataTagsSelect` containing only the `id` field.
 */
export type PageDataTagsInsertResponse = Pick<tsPageDataTagsSelect, 'id'>;

/**
 * Represents the response type for inserting a new page data category.
 * This type is a subset of `tsPageDataCategoriesSelect` containing only the 'id' field.
 */
export type PageDataCategoriesInsertResponse = Pick<tsPageDataCategoriesSelect, 'id'>;

/**
 * Represents the possible types of database tables used in the application.
 *
 * This type is a union of several specific table selection types, each representing
 * a different table in the database. The possible types include:
 * - `tsUsersSelect[]`: An array of user selection objects.
 * - `tsOAuthAccountsSelect[]`: An array of OAuth account selection objects.
 * - `tsSessionTableSelect[]`: An array of session table selection objects.
 * - `tsPermissionsSelect[]`: An array of permission selection objects.
 * - `tsSiteConfigSelect`: A site configuration selection object.
 * - `tsPageDataSelect[]`: An array of page data selection objects.
 * - `tsPageDataTagsSelect[]`: An array of page data tags selection objects.
 * - `tsPageDataCategoriesSelect[]`: An array of page data categories selection objects.
 * - `tsPageContentSelect[]`: An array of page content selection objects.
 * - `tsDiffTrackingSelect[]`: An array of diff tracking selection objects.
 * - `undefined`: Represents an undefined state.
 */
export type DatabaseTables =
	| tsUsersSelect[]
	| tsOAuthAccountsSelect[]
	| tsSessionTableSelect[]
	| tsPermissionsSelect[]
	| tsSiteConfigSelect
	| tsPageDataSelect[]
	| tsPageDataTagsSelect[]
	| tsPageDataCategoriesSelect[]
	| tsPageContentSelect[]
	| tsDiffTrackingSelect[]
	| undefined;

/**
 * Represents a single rank with an identifier and a name.
 */
export interface SingleRank {
	id: string;
	name: string;
}

/**
 * Represents a combined rank with associated details.
 *
 * @property {string} rank - The rank of the entity.
 * @property {string} id - The unique identifier for the rank.
 * @property {string} name - The name associated with the rank.
 */
export interface CombinedRank extends SingleRank {
	rank: string;
}

/**
 * Represents the different types of user lists available in the system.
 *
 * - 'owners': List of owners.
 * - 'admins': List of administrators.
 * - 'editors': List of editors.
 * - 'visitors': List of visitors.
 * - 'all': List of all users.
 */
export type AvailableLists = 'owners' | 'admins' | 'editors' | 'visitors' | 'all';
