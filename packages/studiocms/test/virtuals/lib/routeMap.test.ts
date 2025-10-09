import { describe, expect, it } from 'vitest';
import {
	getDeleteRoute,
	getEditRoute,
	getSluggedRoute,
	makeDashboardRoute,
	makeNonDashboardRoute,
	StudioCMSRoutes,
} from '../../../src/virtuals/lib/routeMap';

describe('routeMap', () => {
	it('getSluggedRoute returns correct slugged route', () => {
		const url = 'edit/pages/';
		const slug = 'my-slug';
		const route = getSluggedRoute(url, slug);
		expect(typeof route).toBe('string');
		expect(route).toContain('my-slug');
	});

	it('getEditRoute returns correct edit route', () => {
		const slug = 'page-123';
		const route = getEditRoute(slug);
		expect(typeof route).toBe('string');
		expect(route).toContain('edit/pages/page-123');
	});

	it('getDeleteRoute returns correct delete route', () => {
		const slug = 'page-456';
		const route = getDeleteRoute(slug);
		expect(typeof route).toBe('string');
		expect(route).toContain('delete/pages/page-456');
	});

	it('makeNonDashboardRoute returns a string', () => {
		const route = makeNonDashboardRoute();
		expect(typeof route).toBe('string');
	});

	it('makeNonDashboardRoute returns correct route with argument', () => {
		const route = makeNonDashboardRoute('about');
		expect(typeof route).toBe('string');
		expect(route).toContain('about');
	});

	it('makeDashboardRoute returns a string', () => {
		const route = makeDashboardRoute();
		expect(typeof route).toBe('string');
	});

	it('makeDashboardRoute returns correct route with argument', () => {
		const route = makeDashboardRoute('profile');
		expect(typeof route).toBe('string');
		expect(route).toContain('profile');
	});

	it('StudioCMSRoutes.mainLinks contains expected keys', () => {
		const keys = [
			'baseSiteURL',
			'dashboardIndex',
			'userProfile',
			'contentManagement',
			'contentManagementCreate',
			'contentManagementEdit',
			'contentManagementFolderCreate',
			'contentManagementFolderEdit',
			'contentManagementDiff',
			'createPage',
			'siteConfiguration',
			'smtpConfiguration',
			'userManagement',
			'userManagementEdit',
			'plugins',
			'unverifiedEmail',
			'passwordReset',
		] as const;
		for (const key of keys) {
			expect(StudioCMSRoutes.mainLinks[key]).toBeDefined();
			expect(typeof StudioCMSRoutes.mainLinks[key]).toBe('string');
		}
	});

	it('StudioCMSRoutes.authLinks contains expected keys and functions', () => {
		const keys = [
			'loginURL',
			'logoutURL',
			'signupURL',
			'loginAPI',
			'logoutAPI',
			'registerAPI',
			'forgotPasswordAPI',
		] as const;
		for (const key of keys) {
			expect(StudioCMSRoutes.authLinks[key]).toBeDefined();
			expect(typeof StudioCMSRoutes.authLinks[key]).toBe('string');
		}
		expect(typeof StudioCMSRoutes.authLinks.oAuthIndex).toBe('function');
		expect(typeof StudioCMSRoutes.authLinks.oAuthCallback).toBe('function');
		expect(typeof StudioCMSRoutes.authLinks.oAuthIndex('github')).toBe('string');
		expect(typeof StudioCMSRoutes.authLinks.oAuthCallback('github')).toBe('string');
	});

	it('StudioCMSRoutes.endpointLinks contains expected keys and nested objects', () => {
		expect(StudioCMSRoutes.endpointLinks.searchList).toBeDefined();
		expect(typeof StudioCMSRoutes.endpointLinks.searchList).toBe('string');
		expect(StudioCMSRoutes.endpointLinks.partials).toBeDefined();
		expect(typeof StudioCMSRoutes.endpointLinks.partials.livePreviewBox).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.partials.userListItems).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.partials.render).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.partials.editor).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.config).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.users).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.profile).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.createResetLink).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.resetPassword).toBe('string');
		expect(StudioCMSRoutes.endpointLinks.content).toBeDefined();
		expect(typeof StudioCMSRoutes.endpointLinks.content.page).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.content.folder).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.content.diff).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.plugins).toBe('string');
		expect(StudioCMSRoutes.endpointLinks.newUsers).toBeDefined();
		expect(typeof StudioCMSRoutes.endpointLinks.newUsers.create).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.newUsers.invite).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.apiTokens).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.verifySession).toBe('string');
		expect(StudioCMSRoutes.endpointLinks.mailer).toBeDefined();
		expect(typeof StudioCMSRoutes.endpointLinks.mailer.config).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.mailer.testEmail).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.verifyEmail).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.emailNotificationSettingsSite).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.resendVerificationEmail).toBe('string');
		expect(typeof StudioCMSRoutes.endpointLinks.updateUserNotifications).toBe('string');
		expect(StudioCMSRoutes.endpointLinks.templates).toBeDefined();
		expect(typeof StudioCMSRoutes.endpointLinks.templates).toBe('string');
	});

	it('StudioCMSRoutes.sdk contains expected keys', () => {
		expect(typeof StudioCMSRoutes.sdk.pages).toBe('string');
		expect(typeof StudioCMSRoutes.sdk.fallback_pages).toBe('string');
		expect(typeof StudioCMSRoutes.sdk.updateLatestVersionCache).toBe('string');
		expect(typeof StudioCMSRoutes.sdk.changelog).toBe('string');
	});

	it('StudioCMSRoutes.fts contains expected keys', () => {
		expect(typeof StudioCMSRoutes.fts.step1).toBe('string');
		expect(typeof StudioCMSRoutes.fts.step2).toBe('string');
	});
});
