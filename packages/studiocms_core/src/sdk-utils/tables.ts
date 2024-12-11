import { asDrizzleTable } from '@astrojs/db/utils';
import {
	StudioCMSDiffTracking,
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPermissions,
	StudioCMSSessionTable,
	StudioCMSSiteConfig,
	StudioCMSUsers,
} from '../db/tables';

/**
 * # StudioCMS - Page Content Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsPageContent = asDrizzleTable('StudioCMSPageContent', StudioCMSPageContent);

/**
 * # StudioCMS - Page Data Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsPageData = asDrizzleTable('StudioCMSPageData', StudioCMSPageData);

/**
 * # StudioCMS - Page Data Categories Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsPageDataCategories = asDrizzleTable(
	'StudioCMSPageDataCategories',
	StudioCMSPageDataCategories
);

/**
 * # StudioCMS - Page Data Tags Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsPageDataTags = asDrizzleTable('StudioCMSPageDataTags', StudioCMSPageDataTags);

/**
 * # StudioCMS - Permissions Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsPermissions = asDrizzleTable('StudioCMSPermissions', StudioCMSPermissions);

/**
 * # StudioCMS - Session Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsSessionTable = asDrizzleTable('StudioCMSSessionTable', StudioCMSSessionTable);

/**
 * # StudioCMS - Site Config Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsSiteConfig = asDrizzleTable('StudioCMSSiteConfig', StudioCMSSiteConfig);

/**
 * # StudioCMS - Users Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsUsers = asDrizzleTable('StudioCMSUsers', StudioCMSUsers);

/**
 * # StudioCMS - OAuth Accounts Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsOAuthAccounts = asDrizzleTable('StudioCMSOAuthAccounts', StudioCMSOAuthAccounts);

/**
 * # StudioCMS - Diff Tracking Table
 * @description Exported TypeSafe Table definition for use in StudioCMS Integrations
 */
export const tsDiffTracking = asDrizzleTable('StudioCMSDiffTracking', StudioCMSDiffTracking);
