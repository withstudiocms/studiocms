import { defineDb } from 'astro:db';
import {
	StudioCMSDiffTracking,
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPageFolderStructure,
	StudioCMSPermissions,
	StudioCMSSessionTable,
	StudioCMSSiteConfig,
	StudioCMSUserResetTokens,
	StudioCMSUsers,
} from './tables.js';

// Export the Database Configuration for StudioCMS
export default defineDb({
	tables: {
		StudioCMSPageContent,
		StudioCMSPageData,
		StudioCMSPageDataCategories,
		StudioCMSPageDataTags,
		StudioCMSPermissions,
		StudioCMSSessionTable,
		StudioCMSSiteConfig,
		StudioCMSUsers,
		StudioCMSOAuthAccounts,
		StudioCMSDiffTracking,
		StudioCMSPageFolderStructure,
		StudioCMSUserResetTokens,
	},
});
