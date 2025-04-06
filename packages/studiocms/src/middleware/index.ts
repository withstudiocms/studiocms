import { defineMiddleware } from 'astro:middleware';
import { getUserData } from 'studiocms:auth/lib/user';
import { verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { isEmailVerificationEnabled } from 'studiocms:auth/lib/verify-email';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';

export const onRequest = defineMiddleware(async (ctx, next) => {
	const userSessionData = await getUserData(ctx);

	const [
		isVisitor,
		isEditor,
		isAdmin,
		isOwner,
		emailVerificationEnabled,
		latestVersion,
		siteConfig,
	] = await Promise.all([
		verifyUserPermissionLevel(userSessionData, 'visitor'),
		verifyUserPermissionLevel(userSessionData, 'editor'),
		verifyUserPermissionLevel(userSessionData, 'admin'),
		verifyUserPermissionLevel(userSessionData, 'owner'),
		isEmailVerificationEnabled(),
		studioCMS_SDK_Cache.GET.latestVersion(),
		studioCMS_SDK_Cache.GET.siteConfig(),
	]);

	ctx.locals.latestVersion = latestVersion;
	ctx.locals.siteConfig = siteConfig;
	ctx.locals.userSessionData = userSessionData;
	ctx.locals.emailVerificationEnabled = emailVerificationEnabled;
	ctx.locals.defaultLang = defaultLang;
	ctx.locals.routeMap = StudioCMSRoutes;
	ctx.locals.userPermissionLevel = {
		isVisitor,
		isEditor,
		isAdmin,
		isOwner,
	};

	return next();
});
