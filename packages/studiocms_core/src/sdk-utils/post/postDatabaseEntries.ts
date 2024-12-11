import { db } from 'astro:db';
import { tsPageDataCategories, tsPageDataTags, tsPermissions } from '../tables';
import type { STUDIOCMS_SDK } from '../types';
import { generateRandomIDNumber } from '../utils';

/**
 * The `postDatabaseEntries` object provides methods to insert various types of entries into the database.
 *
 * @type {STUDIOCMS_SDK['POST']['databaseEntries']}
 *
 * @property {Function} tags - Asynchronously inserts an array of tag objects into the `tsPageDataTags` table.
 * @property {Function} categories - Asynchronously inserts an array of category objects into the `tsPageDataCategories` table.
 * @property {Function} permissions - Asynchronously inserts an array of permission objects into the `tsPermissions` table.
 *
 * @method tags
 * @param {Array} tags - An array of tag objects to be inserted.
 * @returns {Promise<Array>} - A promise that resolves to an array of inserted tag IDs.
 *
 * @method categories
 * @param {Array} categories - An array of category objects to be inserted.
 * @returns {Promise<Array>} - A promise that resolves to an array of inserted category IDs.
 *
 * @method permissions
 * @param {Array} permissions - An array of permission objects to be inserted.
 * @returns {Promise<Array>} - A promise that resolves to an array of inserted permission objects.
 * @throws {Error} - Throws an error if a user already has a rank assigned.
 */
export const postDatabaseEntries: STUDIOCMS_SDK['POST']['databaseEntries'] = {
	tags: async (tags) => {
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
			.returning({ id: tsPageDataTags.id })
			.catch((error) => {
				throw new Error(error);
			});
	},
	categories: async (categories) => {
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
			.returning({ id: tsPageDataCategories.id })
			.catch((error) => {
				throw new Error(error);
			});
	},
	permissions: async (permissions) => {
		const currentPermittedUsers = await db.select().from(tsPermissions);

		for (const permission of permissions) {
			const userAlreadyExists = currentPermittedUsers.find((user) => user.user === permission.user);

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
			.returning({ user: tsPermissions.user, rank: tsPermissions.rank })
			.catch((error) => {
				throw new Error(error);
			});
	},
};

export default postDatabaseEntries;
