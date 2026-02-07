/** biome-ignore-all lint/style/noNonNullAssertion: allowed for tests */
import type { AstroConfig } from 'astro';
import { describe, expect } from 'vitest';
import {
	AstroConfigViteSettings,
	AuthSessionCookieName,
	CMSMailerConfigId,
	CMSNotificationSettingsId,
	CMSSiteConfigId,
	currentRESTAPIVersions,
	defaultCacheLifeTime,
	FAVICON_ASSETS,
	GhostUserDefaults,
	LinkNewOAuthCookieName,
	makeDashboardRoute,
	Next_MailerConfigId,
	Next_NotificationSettingsId,
	Next_SiteConfigId,
	NotificationSettingsDefaults,
	routesDir,
	STUDIOCMS_CDN_URL,
	STUDIOCMS_EDITOR_CSRF_COOKIE_NAME,
	STUDIOCMS_THEME_COLOR,
	StudioCMSDefaultRobotsConfig,
	StudioCMSMarkdownDefaults,
	studioCMSSocials,
	versionCacheLifetime,
} from '../src/consts';
import { allureTester } from './fixtures/allureTester';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'consts.ts tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			name: 'CMSSiteConfigId',
			actual: CMSSiteConfigId,
			expected: 1,
		},
		{
			name: 'Next_SiteConfigId',
			actual: Next_SiteConfigId,
			expected: 'SCMS_SITE_CONFIG_1',
		},
		{
			name: 'CMSMailerConfigId',
			actual: CMSMailerConfigId,
			expected: '1',
		},
		{
			name: 'Next_MailerConfigId',
			actual: Next_MailerConfigId,
			expected: 'SCMS_MAILER_CONFIG_1',
		},
		{
			name: 'CMSNotificationSettingsId',
			actual: CMSNotificationSettingsId,
			expected: '1',
		},
		{
			name: 'Next_NotificationSettingsId',
			actual: Next_NotificationSettingsId,
			expected: 'SCMS_NOTIFICATION_SETTINGS_1',
		},
		{
			name: 'defaultCacheLifeTime',
			actual: defaultCacheLifeTime,
			expected: '5m',
		},
		{
			name: 'versionCacheLifetime',
			actual: versionCacheLifetime,
			expected: 1000 * 60 * 60 * 24 * 7,
		},
		{
			name: 'currentRESTAPIVersions',
			actual: currentRESTAPIVersions[0],
			expected: 'v1',
		},
		{
			name: 'routesDir.fts',
			actual: routesDir.fts('setup'),
			expected: 'studiocms/src/routes/firstTimeSetupRoutes/setup',
		},
		{
			name: 'routesDir.dashRoute',
			actual: routesDir.dashRoute('main'),
			expected: 'studiocms/src/routes/dashboard/main',
		},
		{
			name: 'routesDir.errors',
			actual: routesDir.errors('404'),
			expected: 'studiocms/src/routes/error-pages/404',
		},
		{
			name: 'routesDir.authPage',
			actual: routesDir.authPage('login'),
			expected: 'studiocms/src/routes/auth/login',
		},
		{
			name: 'routesDir.dashApi',
			actual: routesDir.dashApi('stats'),
			expected: 'studiocms/src/routes/api/dashboard/stats',
		},
		{
			name: 'routesDir.authAPI',
			actual: routesDir.authAPI('callback'),
			expected: 'studiocms/src/routes/api/auth/callback',
		},
		{
			name: 'routesDir.api',
			actual: routesDir.api('misc'),
			expected: 'studiocms/src/routes/api/misc',
		},
		{
			name: 'routesDir.sdk',
			actual: routesDir.sdk('client'),
			expected: 'studiocms/src/routes/api/sdk/client',
		},
		{
			name: 'routesDir.mailer',
			actual: routesDir.mailer('send'),
			expected: 'studiocms/src/routes/api/mailer/send',
		},
		{
			name: 'routesDir.v1Rest',
			actual: routesDir.v1Rest('users'),
			expected: 'studiocms/src/routes/api/rest/v1/users',
		},
		{
			name: 'routesDir.middleware',
			actual: routesDir.middleware('auth'),
			expected: 'studiocms/src/middleware/auth',
		},
		{
			name: 'studioCMSSocials.github',
			actual: studioCMSSocials.github,
			expected: 'https://github.com/withstudiocms/studiocms',
		},
		{
			name: 'studioCMSSocials.githubLicense',
			actual: studioCMSSocials.githubLicense,
			expected: 'https://github.com/withstudiocms/studiocms/blob/main/packages/studiocms/LICENSE',
		},
		{
			name: 'studioCMSSocials.discord',
			actual: studioCMSSocials.discord,
			expected: 'https://chat.studiocms.dev',
		},
		{
			name: 'studioCMSSocials.npm',
			actual: studioCMSSocials.npm,
			expected: 'https://npm.im/studiocms',
		},
		{
			name: 'GhostUserDefaults.id',
			actual: GhostUserDefaults.id,
			expected: '_StudioCMS_Ghost_User_',
		},
		{
			name: 'GhostUserDefaults.name',
			actual: GhostUserDefaults.name,
			expected: 'Ghost (deleted user)',
		},
		{
			name: 'GhostUserDefaults.username',
			actual: GhostUserDefaults.username,
			expected: 'studiocms_ghost_user',
		},
		{
			name: 'GhostUserDefaults.avatar',
			actual: GhostUserDefaults.avatar,
			expected: 'https://cdn.studiocms.dev/default_avatar.png',
		},
		{
			name: 'NotificationSettingsDefaults.emailVerification',
			actual: NotificationSettingsDefaults.emailVerification,
			expected: false,
		},
		{
			name: 'NotificationSettingsDefaults.oAuthBypassVerification',
			actual: NotificationSettingsDefaults.oAuthBypassVerification,
			expected: false,
		},
		{
			name: 'NotificationSettingsDefaults.requireEditorVerification',
			actual: NotificationSettingsDefaults.requireEditorVerification,
			expected: false,
		},
		{
			name: 'NotificationSettingsDefaults.requireAdminVerification',
			actual: NotificationSettingsDefaults.requireAdminVerification,
			expected: false,
		},
		{
			name: 'makeDashboardRoute',
			actual: makeDashboardRoute('dashboard/')('stats'),
			expected: 'dashboard/stats',
		},
		{
			name: 'makeDashboardRoute with root',
			actual: makeDashboardRoute('/')('main'),
			expected: '/main',
		},
		{
			name: 'StudioCMSMarkdownDefaults.flavor',
			actual: StudioCMSMarkdownDefaults.flavor,
			expected: 'studiocms',
		},
		{
			name: 'StudioCMSMarkdownDefaults.autoLinkHeadings',
			actual: StudioCMSMarkdownDefaults.autoLinkHeadings,
			expected: false,
		},
		{
			name: 'StudioCMSMarkdownDefaults.callouts',
			actual: StudioCMSMarkdownDefaults.callouts,
			expected: false,
		},
		{
			name: 'StudioCMSMarkdownDefaults.discordSubtext',
			actual: StudioCMSMarkdownDefaults.discordSubtext,
			expected: false,
		},
		{
			name: 'AstroConfigViteSettings.build.chunkSizeWarningLimit',
			actual: AstroConfigViteSettings!.build!.chunkSizeWarningLimit,
			expected: 1200,
		},
		{
			name: 'STUDIOCMS_EDITOR_CSRF_COOKIE_NAME',
			actual: STUDIOCMS_EDITOR_CSRF_COOKIE_NAME,
			expected: 'studiocms-editor-csrf-token',
		},
		{
			name: 'STUDIOCMS_THEME_COLOR',
			actual: STUDIOCMS_THEME_COLOR,
			expected: '#a581f3',
		},
		{
			name: 'STUDIOCMS_CDN_URL',
			actual: STUDIOCMS_CDN_URL,
			expected: 'https://cdn.studiocms.dev',
		},
		{
			name: 'FAVICON_ASSETS.svg',
			actual: FAVICON_ASSETS.svg,
			expected: 'https://cdn.studiocms.dev/favicon.svg',
		},
		{
			name: 'FAVICON_ASSETS.png.light',
			actual: FAVICON_ASSETS.png.light,
			expected: 'https://cdn.studiocms.dev/favicon-light.png',
		},
		{
			name: 'FAVICON_ASSETS.png.dark',
			actual: FAVICON_ASSETS.png.dark,
			expected: 'https://cdn.studiocms.dev/favicon-dark.png',
		},
		{
			name: 'LinkNewOAuthCookieName',
			actual: LinkNewOAuthCookieName,
			expected: 'link-new-o-auth',
		},
		{
			name: 'AuthSessionCookieName',
			actual: AuthSessionCookieName,
			expected: 'auth_session',
		},
	].forEach(({ name, actual, expected }) => {
		test(`Const: ${name}`, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: `Const: ${name}`,
				tags: [...sharedTags, 'module:consts', `const:${name}`],
			});

			await step(`Checking value of ${name}`, async (ctx) => {
				await ctx.parameter('expected', JSON.stringify(expected));
				await ctx.parameter('actual', JSON.stringify(actual));
				expect(actual).toBe(expected);
			});
		});
	});

	test('StudioCMSDefaultRobotsConfig', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'Function: StudioCMSDefaultRobotsConfig',
			tags: [...sharedTags, 'module:consts', 'function:StudioCMSDefaultRobotsConfig'],
		});

		await step('Generating default robots config', async (ctx) => {
			const config: AstroConfig = { site: 'https://example.com' } as AstroConfig;
			const robots = StudioCMSDefaultRobotsConfig({
				config,
				sitemapEnabled: true,
				dashboardRoute: (p) => `/dashboard/${p}`,
			});
			await ctx.parameter('generatedConfig', JSON.stringify(robots, null, 2));
			expect(robots.host).toBe('example.com');
			expect(robots.sitemap).toBe(true);
			expect(robots.policy![0].userAgent).toContain('*');
			expect(robots.policy![0].disallow).toContain('/dashboard/');
			expect(robots.policy![0].disallow).toContain('/studiocms_api/');
		});
	});
});
