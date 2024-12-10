/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import {
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
} from '../../db/tsTables';
import type { AddDatabaseEntry } from '../types';
import { generateRandomIDNumber } from '../utils';

export const addDatabaseEntry: AddDatabaseEntry = {
	pages: {
		/**
		 * Adds a new page entry to the database.
		 *
		 * @param pageData - An object containing the page metadata.
		 * @param pageContent - An object containing the page content.
		 *
		 * @returns A promise that resolves to an object containing the newly inserted page data and content.
		 *
		 * @throws Will throw an error if there is an error during the insertion process.
		 */
		insert: async (pageData, pageContent) => {
			const newContentID = crypto.randomUUID().toString();

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
				categories: JSON.stringify(pageData.categories),
				tags: JSON.stringify(pageData.tags),
				contributorIds: JSON.stringify(pageData.contributorIds),
			};

			const contentData = {
				id: crypto.randomUUID().toString(),
				contentId: newContentID,
				contentLang: pageContent.contentLang || 'default',
				content: pageContent.content || '',
			};

			const NOW = new Date();

			const [newPageData, newPageContent] = await db
				.batch([
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
				])
				.catch((error) => {
					throw new Error(error);
				});

			return {
				pageData: newPageData,
				pageContent: newPageContent,
			};
		},
	},
	pageContent: {
		insert: async (pageId, pageContent) => {
			return await db
				.insert(tsPageContent)
				.values({
					id: crypto.randomUUID().toString(),
					contentId: pageId,
					contentLang: pageContent.contentLang || 'default',
					content: pageContent.content || '',
				})
				.returning({ id: tsPageContent.id })
				.catch((error) => {
					throw new Error(error);
				});
		},
	},
	tags: {
		insert: async (tag) => {
			return await db
				.insert(tsPageDataTags)
				.values({
					name: tag.name,
					description: tag.description,
					slug: tag.slug,
					meta: JSON.stringify(tag.meta),
					id: generateRandomIDNumber(9),
				})
				.returning({ id: tsPageDataTags.id })
				.catch((error) => {
					throw new Error(error);
				});
		},
	},
	categories: {
		insert: async (category) => {
			return await db
				.insert(tsPageDataCategories)
				.values({
					name: category.name,
					description: category.description,
					slug: category.slug,
					meta: JSON.stringify(category.meta),
					id: generateRandomIDNumber(9),
				})
				.returning({ id: tsPageDataCategories.id })
				.catch((error) => {
					throw new Error(error);
				});
		},
	},
	permissions: {
		insert: async (userId, rank) => {
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
				.returning({ user: tsPermissions.user, rank: tsPermissions.rank })
				.catch((error) => {
					throw new Error(error);
				});
		},
	},
};
