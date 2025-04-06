import { defineMiddleware } from 'astro:middleware';
import { getUserData } from 'studiocms:auth/lib/user';
import { verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { isEmailVerificationEnabled } from 'studiocms:auth/lib/verify-email';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';

export const onRequest = defineMiddleware(async (context, next) => {
	const { locals } = context;

	const [latestVersion, siteConfig, userSessionData, emailVerificationEnabled] = await Promise.all([
		studioCMS_SDK_Cache.GET.latestVersion(),
		studioCMS_SDK_Cache.GET.siteConfig(),
		getUserData(context),
		isEmailVerificationEnabled(),
	]);

	const [isVisitor, isEditor, isAdmin, isOwner] = await Promise.all([
		verifyUserPermissionLevel(userSessionData, 'visitor'),
		verifyUserPermissionLevel(userSessionData, 'editor'),
		verifyUserPermissionLevel(userSessionData, 'admin'),
		verifyUserPermissionLevel(userSessionData, 'owner'),
	]);

	locals.latestVersion = latestVersion;
	locals.siteConfig = siteConfig;
	locals.userSessionData = userSessionData;
	locals.emailVerificationEnabled = emailVerificationEnabled;
	locals.defaultLang = defaultLang;
	locals.routeMap = StudioCMSRoutes;
	locals.userPermissionLevel = {
		isVisitor,
		isEditor,
		isAdmin,
		isOwner,
	};

	return next();
});
