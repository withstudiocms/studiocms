/** biome-ignore-all lint/style/noNonNullAssertion: allowed for tests */
import type { AstroConfig } from 'astro';
import { describe, expect, it } from 'vitest';
import {
	AstroConfigImageSettings,
	AstroConfigViteSettings,
	AuthSessionCookieName,
	authAPIRoute,
	CMSMailerConfigId,
	CMSNotificationSettingsId,
	CMSSiteConfigId,
	currentRESTAPIVersions,
	dashboardAPIRoute,
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
	ValidRanks,
	versionCacheLifetime,
} from '../src/consts';

describe('consts.ts', () => {
	it('should export correct config IDs', () => {
		expect(CMSSiteConfigId).toBe(1);
		expect(Next_SiteConfigId).toBe('SCMS_SITE_CONFIG_1');
		expect(CMSMailerConfigId).toBe('1');
		expect(Next_MailerConfigId).toBe('SCMS_MAILER_CONFIG_1');
		expect(CMSNotificationSettingsId).toBe('1');
		expect(Next_NotificationSettingsId).toBe('SCMS_NOTIFICATION_SETTINGS_1');
	});

	it('should export default cache lifetime values', () => {
		expect(defaultCacheLifeTime).toBe('5m');
		expect(versionCacheLifetime).toBe(1000 * 60 * 60 * 24 * 7);
	});

	it('should export current REST API versions', () => {
		expect(currentRESTAPIVersions).toEqual(['v1']);
	});

	it('routesDir should generate correct paths', () => {
		expect(routesDir.fts('setup')).toBe('studiocms/src/routes/firstTimeSetupRoutes/setup');
		expect(routesDir.dashRoute('main')).toBe('studiocms/src/routes/dashboard/main');
		expect(routesDir.errors('404')).toBe('studiocms/src/routes/error-pages/404');
		expect(routesDir.authPage('login')).toBe('studiocms/src/routes/auth/login');
		expect(routesDir.dashApi('stats')).toBe('studiocms/src/routes/api/dashboard/stats');
		expect(routesDir.authAPI('callback')).toBe('studiocms/src/routes/api/auth/callback');
		expect(routesDir.api('misc')).toBe('studiocms/src/routes/api/misc');
		expect(routesDir.sdk('client')).toBe('studiocms/src/routes/api/sdk/client');
		expect(routesDir.mailer('send')).toBe('studiocms/src/routes/api/mailer/send');
		expect(routesDir.v1Rest('users')).toBe('studiocms/src/routes/api/rest/v1/users');
		expect(routesDir.middleware('auth')).toBe('studiocms/src/middleware/auth');
	});

	it('should export correct StudioCMS social links', () => {
		expect(studioCMSSocials.github).toMatch(/^https:\/\/github\.com\/withstudiocms\/studiocms/);
		expect(studioCMSSocials.discord).toBe('https://chat.studiocms.dev');
		expect(studioCMSSocials.npm).toBe('https://npm.im/studiocms');
	});

	it('should export GhostUserDefaults', () => {
		expect(GhostUserDefaults.id).toBe('_StudioCMS_Ghost_User_');
		expect(GhostUserDefaults.name).toBe('Ghost (deleted user)');
		expect(GhostUserDefaults.avatar).toMatch(/^https:\/\/seccdn\.libravatar\.org/);
	});

	it('should export NotificationSettingsDefaults', () => {
		expect(NotificationSettingsDefaults.emailVerification).toBe(false);
		expect(NotificationSettingsDefaults.oAuthBypassVerification).toBe(false);
		expect(NotificationSettingsDefaults.requireEditorVerification).toBe(false);
		expect(NotificationSettingsDefaults.requireAdminVerification).toBe(false);
	});

	it('dashboardAPIRoute and authAPIRoute should be functions', () => {
		expect(typeof dashboardAPIRoute).toBe('function');
		expect(typeof authAPIRoute).toBe('function');
	});

	it('makeDashboardRoute should sanitize route', () => {
		const fn = makeDashboardRoute('dashboard/');
		expect(fn('stats')).toBe('dashboard/stats');
		const fn2 = makeDashboardRoute('/');
		expect(fn2('main')).toBe('/main');
	});

	it('should export StudioCMSMarkdownDefaults', () => {
		expect(StudioCMSMarkdownDefaults.flavor).toBe('studiocms');
		expect(StudioCMSMarkdownDefaults.autoLinkHeadings).toBe(false);
		expect(StudioCMSMarkdownDefaults.callouts).toBe(false);
		expect(StudioCMSMarkdownDefaults.discordSubtext).toBe(false);
	});

	it('AstroConfigImageSettings should allow http and https', () => {
		expect(AstroConfigImageSettings.remotePatterns).toEqual([
			{ protocol: 'https' },
			{ protocol: 'http' },
		]);
	});

	it('AstroConfigViteSettings should set chunkSizeWarningLimit', () => {
		expect(AstroConfigViteSettings.build?.chunkSizeWarningLimit).toBe(700);
	});

	it('StudioCMSDefaultRobotsConfig should generate correct config', () => {
		const config: AstroConfig = { site: 'https://example.com' } as AstroConfig;
		const robots = StudioCMSDefaultRobotsConfig({
			config,
			sitemapEnabled: true,
			dashboardRoute: (p) => `/dashboard/${p}`,
		});
		expect(robots.host).toBe('example.com');
		expect(robots.sitemap).toBe(true);
		expect(robots.policy![0].userAgent).toContain('*');
		expect(robots.policy![0].disallow).toContain('/dashboard/');
		expect(robots.policy![0].disallow).toContain('/studiocms_api/');
	});

	it('should export editor CSRF cookie name', () => {
		expect(STUDIOCMS_EDITOR_CSRF_COOKIE_NAME).toBe('studiocms-editor-csrf-token');
	});

	it('should export theme color', () => {
		expect(STUDIOCMS_THEME_COLOR).toBe('#a581f3');
	});

	it('should export CDN URL and favicon assets', () => {
		expect(STUDIOCMS_CDN_URL).toBe('https://cdn.studiocms.dev');
		expect(FAVICON_ASSETS.svg).toBe(`${STUDIOCMS_CDN_URL}/favicon.svg`);
		expect(FAVICON_ASSETS.png.light).toBe(`${STUDIOCMS_CDN_URL}/favicon-light.png`);
		expect(FAVICON_ASSETS.png.dark).toBe(`${STUDIOCMS_CDN_URL}/favicon-dark.png`);
	});

	it('should export OAuth cookie names', () => {
		expect(LinkNewOAuthCookieName).toBe('link-new-o-auth');
		expect(AuthSessionCookieName).toBe('auth_session');
	});

	it('ValidRanks should be a readonly set', () => {
		expect(ValidRanks instanceof Set).toBe(true);
		expect(typeof ValidRanks.has).toBe('function');
	});
});
