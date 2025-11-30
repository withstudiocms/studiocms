import { db } from 'astro:db';
import type { APIRoute } from 'astro';
import { getStudioCMSDb } from '../db/client.js';
import { remapFunctions } from '../lib/remapUtils.js';
import { jsonResponse } from '../lib/response-utils.js';
import { AstroDBTableSchema } from '../lib/tableMap.js';

const studioCMSDb = await getStudioCMSDb();

async function migrateUsersTable() {
	const astroUsers = await db.select().from(AstroDBTableSchema.StudioCMSUsers);

	if (astroUsers.length > 0) {
		const remappedData = remapFunctions.StudioCMSUsers(astroUsers);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSUsersTable')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} users.`);
	}
}

async function migratePageDataTable() {
	const astroPageData = await db.select().from(AstroDBTableSchema.StudioCMSPageData);

	if (astroPageData.length > 0) {
		const remappedData = remapFunctions.StudioCMSPageData(astroPageData);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPageData')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} page data items.`);
	}
}

async function migratePageFolderStructureTable() {
	const astroPageFolders = await db.select().from(AstroDBTableSchema.StudioCMSPageFolderStructure);

	if (astroPageFolders.length > 0) {
		const remappedData = remapFunctions.StudioCMSPageFolderStructure(astroPageFolders);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPageFolderStructure')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} page folder items.`);
	}
}

async function migratePageDataTagsTable() {
	const astroPageDataTags = await db.select().from(AstroDBTableSchema.StudioCMSPageDataTags);

	if (astroPageDataTags.length > 0) {
		const remappedData = remapFunctions.StudioCMSPageDataTags(astroPageDataTags);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPageDataTags')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} page data tags.`);
	}
}

async function migratePageDataCategoriesTable() {
	const astroPageDataCategories = await db
		.select()
		.from(AstroDBTableSchema.StudioCMSPageDataCategories);

	if (astroPageDataCategories.length > 0) {
		const remappedData = remapFunctions.StudioCMSPageDataCategories(astroPageDataCategories);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPageDataCategories')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} page data categories.`);
	}
}

async function migratePluginDataTable() {
	const astroPluginData = await db.select().from(AstroDBTableSchema.StudioCMSPluginData);

	if (astroPluginData.length > 0) {
		const remappedData = remapFunctions.StudioCMSPluginData(astroPluginData);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPluginData')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} plugin data items.`);
	}
}

async function migrateDynamicConfigSettingsTable() {
	const astroConfigSettings = await db
		.select()
		.from(AstroDBTableSchema.StudioCMSDynamicConfigSettings);

	if (astroConfigSettings.length > 0) {
		const remappedData = remapFunctions.StudioCMSDynamicConfigSettings(astroConfigSettings);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSDynamicConfigSettings')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} dynamic config settings.`);
	}
}

async function migrateApiKeysTable() {
	const astroApiKeys = await db.select().from(AstroDBTableSchema.StudioCMSAPIKeys);

	if (astroApiKeys.length > 0) {
		const remappedData = remapFunctions.StudioCMSAPIKeys(astroApiKeys);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSAPIKeys')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} API keys.`);
	}
}

async function migrateUserResetTokensTable() {
	const astroResetTokens = await db.select().from(AstroDBTableSchema.StudioCMSUserResetTokens);

	if (astroResetTokens.length > 0) {
		const remappedData = remapFunctions.StudioCMSUserResetTokens(astroResetTokens);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSUserResetTokens')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} user reset tokens.`);
	}
}

async function migrateOAuthAccountsTable() {
	const astroOAuthAccounts = await db.select().from(AstroDBTableSchema.StudioCMSOAuthAccounts);

	if (astroOAuthAccounts.length > 0) {
		const remappedData = remapFunctions.StudioCMSOAuthAccounts(astroOAuthAccounts);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSOAuthAccounts')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} OAuth accounts.`);
	}
}

async function migrateSessionTable() {
	const astroSessions = await db.select().from(AstroDBTableSchema.StudioCMSSessionTable);

	if (astroSessions.length > 0) {
		const remappedData = remapFunctions.StudioCMSSessionTable(astroSessions);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSSessionTable')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} sessions.`);
	}
}

async function migratePermissionsTable() {
	const astroPermissions = await db.select().from(AstroDBTableSchema.StudioCMSPermissions);

	if (astroPermissions.length > 0) {
		const remappedData = remapFunctions.StudioCMSPermissions(astroPermissions);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPermissions')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} permissions.`);
	}
}

async function migrateDiffTrackingTable() {
	const astroDiffTracking = await db.select().from(AstroDBTableSchema.StudioCMSDiffTracking);

	if (astroDiffTracking.length > 0) {
		const remappedData = remapFunctions.StudioCMSDiffTracking(astroDiffTracking);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSDiffTracking')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} diff tracking items.`);
	}
}

async function migratePageContentTable() {
	const astroPageContent = await db.select().from(AstroDBTableSchema.StudioCMSPageContent);

	if (astroPageContent.length > 0) {
		const remappedData = remapFunctions.StudioCMSPageContent(astroPageContent);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSPageContent')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} page content items.`);
	}
}

async function migrateEmailVerificationTokensTable() {
	const astroEmailTokens = await db
		.select()
		.from(AstroDBTableSchema.StudioCMSEmailVerificationTokens);

	if (astroEmailTokens.length > 0) {
		const remappedData = remapFunctions.StudioCMSEmailVerificationTokens(astroEmailTokens);

		const insertResult = await studioCMSDb.db
			.insertInto('StudioCMSEmailVerificationTokens')
			.values(remappedData)
			.executeTakeFirst();

		console.log(`Migrated ${insertResult.numInsertedOrUpdatedRows} email verification tokens.`);
	}
}

export const POST: APIRoute = async () => {
	try {
		// Migrate Tables Without References First
		await migrateUsersTable();
		await migratePageDataTable();
		await migratePageFolderStructureTable();
		await migratePageDataTagsTable();
		await migratePageDataCategoriesTable();
		await migratePluginDataTable();
		await migrateDynamicConfigSettingsTable();

		// Then migrate tables with references
		await migrateApiKeysTable();
		await migrateUserResetTokensTable();
		await migrateOAuthAccountsTable();
		await migrateSessionTable();
		await migratePermissionsTable();
		await migrateDiffTrackingTable();
		await migratePageContentTable();
		await migrateEmailVerificationTokensTable();
	} catch (error) {
		console.error('Migration failed:', error);
		return jsonResponse({ success: false, error: 'Migration failed' }, 500);
	}

	return jsonResponse({ success: true });
};
