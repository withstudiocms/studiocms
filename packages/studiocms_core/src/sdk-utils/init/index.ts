import { db } from 'astro:db';
import { CMSSiteConfigId } from '../../consts';
import { authUser } from '../auth';
import { tsSiteConfig } from '../tables';
import type { STUDIOCMS_SDK_INIT, tsSiteConfigInsert } from '../types';

export const studioCMS_SDK_INIT: STUDIOCMS_SDK_INIT = {
	siteConfig: async (config: tsSiteConfigInsert) =>
		await db
			.insert(tsSiteConfig)
			.values({ ...config, id: CMSSiteConfigId })
			.returning()
			.get(),
	ghostUser: async () => {
		const ghostUser = await authUser.ghost.get();
		if (!ghostUser) {
			return await authUser.ghost.create();
		}
		return ghostUser;
	},
};

export default studioCMS_SDK_INIT;
