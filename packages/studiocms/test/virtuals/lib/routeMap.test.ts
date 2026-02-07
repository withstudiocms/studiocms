import { describe, expect } from 'vitest';
import {
	getDeleteRoute,
	getEditRoute,
	getSluggedRoute,
	makeDashboardRoute,
	makeNonDashboardRoute,
	StudioCMSRoutes,
} from '../../../src/virtuals/lib/routeMap';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Route Map Virtual tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('getSluggedRoute - should return correct slugged route', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getSluggedRoute test',
			tags: [...sharedTags, 'routeMap:virtuals', 'function:getSluggedRoute'],
		});

		await step('Testing getSluggedRoute function', async () => {
			const url = 'edit/pages/';
			const slug = 'my-slug';
			const route = getSluggedRoute(url, slug);
			expect(typeof route).toBe('string');
			expect(route).toContain('my-slug');
		});
	});

	test('getEditRoute - should return correct edit route', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getEditRoute test',
			tags: [...sharedTags, 'routeMap:virtuals', 'function:getEditRoute'],
		});

		await step('Testing getEditRoute function', async () => {
			const slug = 'page-123';
			const route = getEditRoute(slug);
			expect(typeof route).toBe('string');
			expect(route).toContain('edit/pages/page-123');
		});
	});

	test('getDeleteRoute - should return correct delete route', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getDeleteRoute test',
			tags: [...sharedTags, 'routeMap:virtuals', 'function:getDeleteRoute'],
		});

		await step('Testing getDeleteRoute function', async () => {
			const slug = 'page-456';
			const route = getDeleteRoute(slug);
			expect(typeof route).toBe('string');
			expect(route).toContain('delete/pages/page-456');
		});
	});

	test('makeNonDashboardRoute - should return correct route', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'makeNonDashboardRoute test',
			tags: [...sharedTags, 'routeMap:virtuals', 'function:makeNonDashboardRoute'],
		});

		await step('Testing makeNonDashboardRoute function', async () => {
			const route = makeNonDashboardRoute('about');
			expect(typeof route).toBe('string');
			expect(route).toContain('about');
		});
	});

	test('makeDashboardRoute - should return correct route', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'makeDashboardRoute test',
			tags: [...sharedTags, 'routeMap:virtuals', 'function:makeDashboardRoute'],
		});

		await step('Testing makeDashboardRoute function', async () => {
			const route = makeDashboardRoute('profile');
			expect(typeof route).toBe('string');
			expect(route).toContain('profile');
		});
	});

	(
		[
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
		] as const
	).forEach((key) => {
		test(`StudioCMSRoutes.mainLinks.${key} should be defined`, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: `StudioCMSRoutes.mainLinks.${key} test`,
				tags: [...sharedTags, 'routeMap:virtuals', `StudioCMSRoutes.mainLinks:${key}`],
			});

			await step(`Checking StudioCMSRoutes.mainLinks.${key} existence`, async () => {
				expect(StudioCMSRoutes.mainLinks[key]).toBeDefined();
				expect(typeof StudioCMSRoutes.mainLinks[key]).toBe('string');
			});
		});
	});

	(
		[
			'loginURL',
			'logoutURL',
			'signupURL',
			'loginAPI',
			'logoutAPI',
			'registerAPI',
			'forgotPasswordAPI',
		] as const
	).forEach((key) => {
		test(`StudioCMSRoutes.authLinks.${key} should be defined`, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: `StudioCMSRoutes.authLinks.${key} test`,
				tags: [...sharedTags, 'routeMap:virtuals', `StudioCMSRoutes.authLinks:${key}`],
			});

			await step(`Checking StudioCMSRoutes.authLinks.${key} existence`, async () => {
				expect(StudioCMSRoutes.authLinks[key]).toBeDefined();
				expect(typeof StudioCMSRoutes.authLinks[key]).toBe('string');
			});
		});
	});

	(['oAuthIndex', 'oAuthCallback'] as const).forEach((key) => {
		test(`StudioCMSRoutes.authLinks.${key} should be defined`, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: `StudioCMSRoutes.authLinks.${key} test`,
				tags: [...sharedTags, 'routeMap:virtuals', `StudioCMSRoutes.authLinks:${key}`],
			});

			await step(`Checking StudioCMSRoutes.authLinks.${key} existence`, async () => {
				expect(StudioCMSRoutes.authLinks[key]).toBeDefined();
				expect(typeof StudioCMSRoutes.authLinks[key]).toBe('function');
			});
		});
	});
});
