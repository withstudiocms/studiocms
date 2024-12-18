/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import {
	tsDiffTracking,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
} from '../tables';
import type { STUDIOCMS_SDK_POST } from '../types';
import { generateRandomIDNumber, handleSDKError } from '../utils';

/**
 * Utility functions for adding various entries to the database.
 */
export const postDatabaseEntry: STUDIOCMS_SDK_POST['databaseEntry'] = {
	pages: async (pageData, pageContent) => {
		try {
			const newContentID = pageData.id || crypto.randomUUID().toString();

			const {
				title,
				slug,
				description,
				authorId = null,
				package: packageName = 'studiocms',
				contentLang = 'default',
				heroImage = '',
				showOnNav = false,
				showAuthor = false,
				showContributors = false,
			} = pageData;

			const stringified = {
				categories: JSON.stringify(pageData.categories || []),
				tags: JSON.stringify(pageData.tags || []),
				contributorIds: JSON.stringify(pageData.contributorIds || []),
			};

			const contentData = {
				id: crypto.randomUUID().toString(),
				contentId: newContentID,
				contentLang: pageContent.contentLang || 'default',
				content: pageContent.content || '',
			};

			const NOW = new Date();

			const [newPageData, newPageContent] = await db.batch([
				db
					.insert(tsPageData)
					.values({
						id: newContentID,
						title,
						slug,
						description,
						authorId,
						contentLang,
						heroImage,
						showAuthor,
						showContributors,
						showOnNav,
						package: packageName,
						publishedAt: NOW,
						updatedAt: NOW,
						...stringified,
					})
					.returning({ id: tsPageData.id }),
				db.insert(tsPageContent).values(contentData).returning({ id: tsPageContent.id }),
			]);

			return {
				pageData: newPageData,
				pageContent: newPageContent,
			};
		} catch (error) {
			handleSDKError(error, 'Error inserting page: An unknown error occurred.');
		}
	},
	pageContent: async (pageContent) => {
		try {
			return await db
				.insert(tsPageContent)
				.values({
					id: pageContent.id || crypto.randomUUID().toString(),
					contentId: pageContent.contentId,
					contentLang: pageContent.contentLang || 'default',
					content: pageContent.content || '',
				})
				.returning({ id: tsPageContent.id });
		} catch (error) {
			handleSDKError(error, 'Error inserting page content: An unknown error occurred.');
		}
	},
	tags: async (tag) => {
		try {
			return await db
				.insert(tsPageDataTags)
				.values({
					name: tag.name,
					description: tag.description,
					slug: tag.slug,
					meta: JSON.stringify(tag.meta),
					id: tag.id || generateRandomIDNumber(9),
				})
				.returning({ id: tsPageDataTags.id });
		} catch (error) {
			handleSDKError(error, 'Error inserting tags: An unknown error occurred.');
		}
	},
	categories: async (category) => {
		try {
			return await db
				.insert(tsPageDataCategories)
				.values({
					name: category.name,
					description: category.description,
					slug: category.slug,
					meta: JSON.stringify(category.meta),
					id: category.id || generateRandomIDNumber(9),
				})
				.returning({ id: tsPageDataCategories.id });
		} catch (error) {
			handleSDKError(error, 'Error inserting categories: An unknown error occurred.');
		}
	},
	permissions: async (userId, rank) => {
		try {
			const userAlreadyExists = await db
				.select()
				.from(tsPermissions)
				.where(eq(tsPermissions.user, userId))
				.get();

			if (userAlreadyExists) {
				throw new Error(
					'User already is already assigned a rank, please update the existing rank instead.'
				);
			}

			return await db
				.insert(tsPermissions)
				.values({
					user: userId,
					rank,
				})
				.returning({ user: tsPermissions.user, rank: tsPermissions.rank });
		} catch (error) {
			handleSDKError(error, 'Error inserting permissions: An unknown error occurred.');
		}
	},
	diffTracking: async (diffData) => {
		try {
			return await db
				.insert(tsDiffTracking)
				.values({
					id: diffData.id || crypto.randomUUID().toString(),
					userId: diffData.userId,
					pageId: diffData.pageId,
					diff: diffData.diff || '',
					timestamp: diffData.timestamp || new Date(),
					pageContentStart: diffData.pageContentStart,
					pageMetaData: JSON.stringify(diffData.pageMetaData || {}),
				})
				.returning();
		} catch (error) {
			handleSDKError(error, 'Error inserting diff tracking: An unknown error occurred.');
		}
	},
};

export default postDatabaseEntry;
