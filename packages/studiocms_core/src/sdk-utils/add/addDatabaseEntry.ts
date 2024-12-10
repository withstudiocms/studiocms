import { db } from 'astro:db';
import { tsPageContent, tsPageData } from '../../db/tsTables';
import type { addDatabaseEntryInsertPage, tsPageContentInsert, tsPageDataInsert } from '../types';

/**
 * Adds a new entry to the specified database table.
 */
export function addDatabaseEntry(database: 'pages') {
	switch (database) {
		case 'pages': {
			return {
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
				insert: async (
					pageData: tsPageDataInsert,
					pageContent: tsPageContentInsert
				): Promise<addDatabaseEntryInsertPage> => {
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

					const TODAY = new Date();

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
									publishedAt: TODAY,
									updatedAt: TODAY,
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
			};
		}
		default: {
			throw new Error('Invalid database entry');
		}
	}
}
