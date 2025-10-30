import type { Effect } from '@withstudiocms/effect';
import type { OptionalNullable } from '@withstudiocms/kysely/core/client';
import type { DatabaseError } from '@withstudiocms/kysely/core/errors';
import type {
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
	StudioCMSUsersTable,
} from '@withstudiocms/kysely/tables';

// ===============================================================
// Table Type Aliases
// ===============================================================

export type tsPageDataCategories = typeof StudioCMSPageDataCategories;
export type tsPageDataTags = typeof StudioCMSPageDataTags;
export type tsPageData = typeof StudioCMSPageData;
export type tsPageContent = typeof StudioCMSPageContent;
export type tsSiteConfig = typeof StudioCMSDynamicConfigSettings;
export type tsUsers = typeof StudioCMSUsersTable;
export type tsPageFolder = typeof StudioCMSPageFolderStructure;
export type tsAPIKeys = typeof StudioCMSAPIKeys;
export type tsDiffTracking = typeof StudioCMSDiffTracking;
export type tsEmailVerificationTokens = typeof StudioCMSEmailVerificationTokens;
export type tsOAuthAccounts = typeof StudioCMSOAuthAccounts;
export type tsPermissions = typeof StudioCMSPermissions;
export type tsPluginData = typeof StudioCMSPluginData;
export type tsSessionTable = typeof StudioCMSSessionTable;
export type tsUserResetTokens = typeof StudioCMSUserResetTokens;

export type tsPageDataCategoriesSelect = tsPageDataCategories['Select']['Type'];
export type tsPageDataTagsSelect = tsPageDataTags['Select']['Type'];
export type tsPageContentSelect = tsPageContent['Select']['Type'];
export type tsUsersSelect = tsUsers['Select']['Type'];
export type tsPageFolderSelect = tsPageFolder['Select']['Type'];
export type tsPageDataSelect = tsPageData['Select']['Type'];
export type tsOAuthAccountsSelect = tsOAuthAccounts['Select']['Type'];
export type tsPermissionsSelect = tsPermissions['Select']['Type'];

// ===============================================================
// SDK Types
// ===============================================================

/**
 * Interface representing combined user data.
 *
 * This interface extends `tsUsersSelect` and includes additional properties
 * for OAuth data and permissions data.
 *
 * @interface CombinedUserData
 * @extends {tsUsersSelect}
 *
 * @property {tsOAuthAccountsSelect[] | undefined} oAuthData - An array of OAuth account data or undefined.
 * @property {tsPermissionsSelect | undefined} permissionsData - Permissions data or undefined.
 */
export interface CombinedUserData extends tsUsersSelect {
	oAuthData: tsOAuthAccountsSelect[] | undefined;
	permissionsData: tsPermissionsSelect | undefined;
}

/**
 * Represents a stripped-down version of the `tsPageDataSelect` type,
 * excluding the properties 'categories', 'tags', and 'contributorIds'.
 */
export type PageDataStripped = Omit<tsPageDataSelect, 'categories' | 'tags' | 'contributorIds'>;

/**
 * Represents the combined data for a page, extending the stripped page data.
 *
 * @interface CombinedPageData
 * @extends PageDataStripped
 *
 * @property {string[]} contributorIds - An array of contributor IDs associated with the page.
 * @property {tsPageDataCategoriesSelect[]} categories - An array of categories selected for the page.
 * @property {tsPageDataTagsSelect[]} tags - An array of tags selected for the page.
 * @property {tsPageContentSelect[]} content - An array of content selected for the page.
 */
export interface CombinedPageData extends PageDataStripped {
	contributorIds: string[];
	categories: tsPageDataCategoriesSelect[];
	tags: tsPageDataTagsSelect[];
	multiLangContent: tsPageContentSelect[];
	defaultContent: tsPageContentSelect | undefined;
	urlRoute: string;
	authorData: tsUsersSelect | undefined;
	contributorsData: tsUsersSelect[];
}

/**
 * Represents page data containing only metadata fields, excluding multilingual and default content.
 *
 * This type omits the `multiLangContent` and `defaultContent` properties from `CombinedPageData`.
 */
export type MetaOnlyPageData = Omit<CombinedPageData, 'multiLangContent' | 'defaultContent'>;

/**
 * Conditional type that returns either `MetaOnlyPageData` or an array of `MetaOnlyPageData`
 * based on whether the generic type `T` extends `CombinedPageData`.
 *
 * @template T - The type to check against `CombinedPageData`.
 * @returns If `T` extends `CombinedPageData`, returns `MetaOnlyPageData`; otherwise, returns `MetaOnlyPageData[]`.
 */
export type PageDataReturnType<T> = T extends CombinedPageData
	? MetaOnlyPageData
	: MetaOnlyPageData[];

/**
 * Represents a node in a folder structure, which may contain child nodes and page data.
 *
 * @property id - Unique identifier for the folder node.
 * @property name - Name of the folder node.
 * @property page - Indicates whether this node represents a page.
 * @property pageData - Data associated with the page, or `null` if not applicable.
 * @property children - Array of child folder nodes.
 */
export interface FolderNode {
	id: string;
	name: string;
	page: boolean;
	pageData: CombinedPageData | null;
	children: FolderNode[];
}

/**
 * Represents a folder item in a list, including its unique identifier, name, and optional parent folder.
 *
 * @property id - The unique identifier for the folder.
 * @property name - The display name of the folder.
 * @property parent - The identifier of the parent folder, or `null` if the folder is at the root level.
 */
export interface FolderListItem {
	id: string;
	name: string;
	parent?: string | null;
}

/**
 * Represents a database query function for retrieving dynamic configuration entries.
 *
 * This function takes an input object containing an optional nullable `id` string
 * and returns an effect that yields a dynamic configuration entry with its `id`
 * and `data` properties, or a `DatabaseError` if the operation fails.
 *
 * @param input - An object containing an optional nullable `id` string.
 * @returns An effect that yields the dynamic configuration entry or a database error.
 */
export type DbQueryFn = (
	input: OptionalNullable<{
		readonly id: string;
		readonly data: string;
	}>
) => Effect.Effect<
	{
		readonly id: string;
		readonly data: {
			readonly [x: string]: unknown;
		};
	},
	DatabaseError,
	never
>;

/**
 * Represents a dynamic configuration entry with a unique identifier and associated data.
 *
 * @template T - The type of the data stored in the configuration entry.
 * @property id - A unique string identifier for the configuration entry.
 * @property data - The configuration data of type T.
 */
export type DynamicConfigEntry<T> = {
	id: string;
	data: T;
};

/**
 * Base interface for dynamic configuration objects in StudioCMS.
 *
 * @property _config_version - The version identifier for the configuration schema.
 */
export interface StudioCMSDynamicConfigBase {
	_config_version: string;
}

/**
 * A version of a dynamic StudioCMS configuration with the internal version field removed.
 *
 * This utility type produces a configuration type based on `T` (which must extend
 * `StudioCMSDynamicConfigBase`) but omits the internal `_config_version` property.
 * It is intended for use when exposing or working with the final, consumer-facing
 * shape of configuration where the internal version metadata should not be present.
 *
 * @template T - The dynamic configuration type extending `StudioCMSDynamicConfigBase`.
 *
 * @remarks
 * Preserves all other properties of `T`.
 */
export type ConfigFinal<T extends StudioCMSDynamicConfigBase> = Omit<T, '_config_version'>;

/**
 * Represents the site configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes various
 * properties related to site settings such as description, title, images,
 * mailer options, and more.
 */
export interface StudioCMSSiteConfig extends StudioCMSDynamicConfigBase {
	description: string;
	title: string;
	defaultOgImage?: string | null | undefined;
	siteIcon?: string | null | undefined;
	loginPageBackground?: string | undefined;
	loginPageCustomImage?: string | null | undefined;
	enableDiffs?: boolean | undefined;
	diffPerPage?: number | undefined;
	gridItems?: string[];
	enableMailer?: boolean | undefined;
	hideDefaultIndex?: boolean | undefined;
}

/**
 * Represents the mailer configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes various
 * properties related to mail server settings such as host, port, security,
 * authentication, and default sender information.
 */
export interface StudioCMSMailerConfig extends StudioCMSDynamicConfigBase {
	host: string;
	port: number;
	secure: boolean;
	proxy?: string | null | undefined;
	auth_user?: string | null | undefined;
	auth_pass?: string | null | undefined;
	tls_rejectUnauthorized?: boolean | null | undefined;
	tls_servername?: string | null | undefined;
	default_sender: string;
}

/**
 * Represents the notification settings configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes various
 * boolean properties that determine the behavior of email verification and
 * user verification requirements.
 */
export interface StudioCMSNotificationSettings extends StudioCMSDynamicConfigBase {
	emailVerification?: boolean | undefined;
	requireAdminVerification?: boolean | undefined;
	requireEditorVerification?: boolean | undefined;
	oAuthBypassVerification?: boolean | undefined;
}

/**
 * Represents the template configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes optional
 * properties for various email templates used in notifications, password resets,
 * user invitations, and email verification.
 */
export interface StudioCMSTemplateConfig extends StudioCMSDynamicConfigBase {
	notifications?: string;
	passwordReset?: string;
	userInvite?: string;
	verifyEmail?: string;
}

/**
 * JWT Header structure.
 */
export type JwtHeader = {
	alg: string;
	typ: string;
};

/**
 * JWT Payload structure.
 */
export type JwtPayload = {
	userId: string;
	exp?: number;
	iat?: number;
};

/**
 * Represents the result of verifying a JWT (JSON Web Token).
 *
 * @property isValid - Indicates whether the JWT is valid.
 * @property userId - The user ID extracted from the token, if available. This is optional and may be undefined if the token is invalid.
 */
export interface JwtVerificationResult {
	isValid: boolean;
	userId?: string; // Optional, as the userId might not be available if the token is invalid
}

/**
 * Represents a single difference item for a page, including metadata and content changes.
 *
 * @property id - Unique identifier for the diff item.
 * @property userId - Identifier of the user who made the change.
 * @property pageId - Identifier of the page associated with the diff.
 * @property timestamp - The date and time when the diff was created, or null if not set.
 * @property pageMetaData - Metadata associated with the page; type is unknown.
 * @property pageContentStart - The initial content of the page before the diff.
 * @property diff - The difference content as a string, or null if not available.
 */
export interface diffItem {
	id: string;
	userId: string;
	pageId: string;
	timestamp: Date | null;
	pageMetaData: unknown;
	pageContentStart: string;
	diff: string | null;
}

/**
 * Represents the result of a diff operation, extending {@link diffItem} but replacing the `pageMetaData` property.
 *
 * @remarks
 * The `pageMetaData` property contains the starting and ending states of page metadata,
 * each represented as a partial selection of {@link tsPageDataSelect}.
 *
 * @see diffItem
 * @see tsPageDataSelect
 */
export interface diffReturn extends Omit<diffItem, 'pageMetaData'> {
	pageMetaData: {
		start: Partial<tsPageDataSelect>;
		end: Partial<tsPageDataSelect>;
	};
}

/**
 * Determines the return type based on whether the generic type `T` extends `diffItem`.
 * If `T` extends `diffItem`, returns `diffReturn`; otherwise, returns an array of `diffReturn`.
 *
 * @template T - The type to check against `diffItem`.
 * @returns `diffReturn` if `T` extends `diffItem`, otherwise `diffReturn[]`.
 */
export type DiffReturnType<T> = T extends diffItem ? diffReturn : diffReturn[];

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
