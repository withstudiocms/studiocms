import { defineMiddleware } from 'astro:middleware';
import { getUserData } from 'studiocms:auth/lib/user';
import { isEmailVerificationEnabled } from 'studiocms:auth/lib/verify-email';
import { defaultLang } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import SCMSUiVersion from 'studiocms:ui/version';
import SCMSVersion from 'studiocms:version';
import { getUserPermissions } from './utils.js';

export const onRequest = defineMiddleware(async (context, next) => {
	const [userSessionData, emailVerificationEnabled, latestVersion, siteConfig] = await Promise.all([
		getUserData(context),
		isEmailVerificationEnabled(),
		studioCMS_SDK_Cache.GET.latestVersion(),
		studioCMS_SDK_Cache.GET.siteConfig(),
	]);

	context.locals.SCMSGenerator = `StudioCMS v${SCMSVersion}`;
	context.locals.SCMSUiGenerator = `StudioCMS UI v${SCMSUiVersion}`;
	context.locals.latestVersion = latestVersion;
	context.locals.siteConfig = siteConfig;
	context.locals.userSessionData = userSessionData;
	context.locals.emailVerificationEnabled = emailVerificationEnabled;
	context.locals.defaultLang = defaultLang;
	context.locals.routeMap = StudioCMSRoutes;
	context.locals.userPermissionLevel = getUserPermissions(userSessionData);

	return next();
});
