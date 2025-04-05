import { defineMiddleware } from 'astro:middleware';
import { getUserData } from 'studiocms:auth/lib/user';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';

export const onRequest = defineMiddleware(async (context, next) => {
	const [latestVersion, siteConfig, userSessionData] = await Promise.all([
		studioCMS_SDK_Cache.GET.latestVersion(),
		studioCMS_SDK_Cache.GET.siteConfig(),
		getUserData(context),
	]);

	context.locals.latestVersion = latestVersion;
	context.locals.siteConfig = siteConfig;
	context.locals.userSessionData = userSessionData;

	return next();
});
