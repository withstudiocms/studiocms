import { db } from 'astro:db';
import {
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
} from '../tables';
import type { STUDIOCMS_SDK_POST } from '../types';
import { StudioCMS_SDK_Error, generateRandomIDNumber } from '../utils';

/**
 * The `postDatabaseEntries` object provides methods to insert various types of entries into the database.
 */
export const postDatabaseEntries: STUDIOCMS_SDK_POST['databaseEntries'] = {
	tags: async (tags) => {
		try {
			return await db
				.insert(tsPageDataTags)
				.values(
					tags.map((tag) => {
						return {
							id: tag.id || generateRandomIDNumber(9),
							name: tag.name,
							slug: tag.slug,
							description: tag.description,
							meta: JSON.stringify(tag.meta),
						};
					})
				)
				.returning({ id: tsPageDataTags.id });
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error inserting tags: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error inserting tags: An unknown error occurred.', `${error}`);
		}
	},
	categories: async (categories) => {
		try {
			return await db
				.insert(tsPageDataCategories)
				.values(
					categories.map((category) => {
						return {
							id: category.id || generateRandomIDNumber(9),
							name: category.name,
							slug: category.slug,
							description: category.description,
							meta: JSON.stringify(category.meta),
						};
					})
				)
				.returning({ id: tsPageDataCategories.id });
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error inserting categories: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error(
				'Error inserting categories: An unknown error occurred.',
				`${error}`
			);
		}
	},
	permissions: async (permissions) => {
		try {
			const currentPermittedUsers = await db.select().from(tsPermissions);

			for (const permission of permissions) {
				const userAlreadyExists = currentPermittedUsers.find(
					(user) => user.user === permission.user
				);

				if (userAlreadyExists) {
					throw new Error(
						`User with ID ${permission.user} already has a rank assigned. Please update the existing rank instead.`
					);
				}
			}

			return await db
				.insert(tsPermissions)
				.values(
					permissions.map((permission) => {
						return {
							user: permission.user,
							rank: permission.rank,
						};
					})
				)
				.returning({ user: tsPermissions.user, rank: tsPermissions.rank });
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error inserting permissions: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error(
				'Error inserting permissions: An unknown error occurred.',
				`${error}`
			);
		}
	},
	pages: async (pages) => {
		try {
			const queries = [];

			for (const { pageData, pageContent } of pages) {
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

				queries.push(
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
						.returning(),
					db.insert(tsPageContent).values(contentData).returning()
				);
			}

			const [head, ...tail] = queries;

			if (head) {
				await db.batch([head, ...tail]);
			}
		} catch (error) {
			if (error instanceof Error) {
				throw new StudioCMS_SDK_Error(`Error inserting page: ${error.message}`, error.stack);
			}
			throw new StudioCMS_SDK_Error('Error inserting page: An unknown error occurred.', `${error}`);
		}
	},
};

export default postDatabaseEntries;
