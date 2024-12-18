import { db } from 'astro:db';
import { CMSSiteConfigId } from '../../consts';
import { authUser } from '../auth';
import { tsSiteConfig } from '../tables';
import type { STUDIOCMS_SDK_INIT, tsSiteConfigInsert } from '../types';
import { handleSDKError } from '../utils';

export const studioCMS_SDK_INIT: STUDIOCMS_SDK_INIT = {
	siteConfig: async (config: tsSiteConfigInsert) => {
		try {
			// Insert the site configuration record into the database and return the inserted record.
			return await db
				.insert(tsSiteConfig)
				.values({ ...config, id: CMSSiteConfigId })
				.returning()
				.get();
		} catch (error) {
			handleSDKError(error, 'Error creating site configuration: An unknown error occurred.');
		}
	},
	ghostUser: async () => {
		try {
			// Check if the ghost user already exists in the database.
			const ghostUser = await authUser.ghost.get();

			// If the ghost user does not exist, create it and return the inserted record
			if (!ghostUser) {
				// Create the ghost user and return the inserted record.
				return await authUser.ghost.create();
			}

			// If the ghost user already exists, return the existing record.
			return ghostUser;
		} catch (error) {
			handleSDKError(error, 'Error creating ghost user: An unknown error occurred.');
		}
	},
};

export default studioCMS_SDK_INIT;
