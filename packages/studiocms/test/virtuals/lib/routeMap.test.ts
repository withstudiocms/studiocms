import * as allure from 'allure-js-commons';
import { describe, expect, it, test } from 'vitest';
import {
	getDeleteRoute,
	getEditRoute,
	getSluggedRoute,
	makeDashboardRoute,
	makeNonDashboardRoute,
	StudioCMSRoutes,
} from '../../../src/virtuals/lib/routeMap';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Route Map Virtual tests';

describe(parentSuiteName, () => {
	test('getSluggedRoute - should return correct slugged route', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getSluggedRoute test');
		const tags = [...sharedTags, 'routeMap:virtuals', 'function:getSluggedRoute'];
		await allure.tags(...tags);

		await allure.step('Testing getSluggedRoute function', async () => {
			const url = 'edit/pages/';
			const slug = 'my-slug';
			const route = getSluggedRoute(url, slug);
			expect(typeof route).toBe('string');
			expect(route).toContain('my-slug');
		});
	});

	test('getEditRoute - should return correct edit route', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getEditRoute test');
		const tags = [...sharedTags, 'routeMap:virtuals', 'function:getEditRoute'];
		await allure.tags(...tags);

		await allure.step('Testing getEditRoute function', async () => {
			const slug = 'page-123';
			const route = getEditRoute(slug);
			expect(typeof route).toBe('string');
			expect(route).toContain('edit/pages/page-123');
		});
	});

	test('getDeleteRoute - should return correct delete route', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getDeleteRoute test');
		const tags = [...sharedTags, 'routeMap:virtuals', 'function:getDeleteRoute'];
		await allure.tags(...tags);

		await allure.step('Testing getDeleteRoute function', async () => {
			const slug = 'page-456';
			const route = getDeleteRoute(slug);
			expect(typeof route).toBe('string');
			expect(route).toContain('delete/pages/page-456');
		});
	});

	test('makeNonDashboardRoute - should return correct route', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeNonDashboardRoute test');
		const tags = [...sharedTags, 'routeMap:virtuals', 'function:makeNonDashboardRoute'];
		await allure.tags(...tags);

		await allure.step('Testing makeNonDashboardRoute function', async () => {
			const route = makeNonDashboardRoute('about');
			expect(typeof route).toBe('string');
			expect(route).toContain('about');
		});
	});

	test('makeDashboardRoute - should return correct route', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeDashboardRoute test');
		const tags = [...sharedTags, 'routeMap:virtuals', 'function:makeDashboardRoute'];
		await allure.tags(...tags);

		await allure.step('Testing makeDashboardRoute function', async () => {
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
		test(`StudioCMSRoutes.mainLinks.${key} should be defined`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`StudioCMSRoutes.mainLinks.${key} test`);
			const tags = [...sharedTags, 'routeMap:virtuals', `StudioCMSRoutes.mainLinks:${key}`];
			await allure.tags(...tags);

			await allure.step(`Checking StudioCMSRoutes.mainLinks.${key} existence`, async () => {
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
		test(`StudioCMSRoutes.authLinks.${key} should be defined`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`StudioCMSRoutes.authLinks.${key} test`);
			const tags = [...sharedTags, 'routeMap:virtuals', `StudioCMSRoutes.authLinks:${key}`];
			await allure.tags(...tags);

			await allure.step(`Checking StudioCMSRoutes.authLinks.${key} existence`, async () => {
				expect(StudioCMSRoutes.authLinks[key]).toBeDefined();
				expect(typeof StudioCMSRoutes.authLinks[key]).toBe('string');
			});
		});
	});

	(['oAuthIndex', 'oAuthCallback'] as const).forEach((key) => {
		test(`StudioCMSRoutes.authLinks.${key} should be defined`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`StudioCMSRoutes.authLinks.${key} test`);
			const tags = [...sharedTags, 'routeMap:virtuals', `StudioCMSRoutes.authLinks:${key}`];
			await allure.tags(...tags);

			await allure.step(`Checking StudioCMSRoutes.authLinks.${key} existence`, async () => {
				expect(StudioCMSRoutes.authLinks[key]).toBeDefined();
				expect(typeof StudioCMSRoutes.authLinks[key]).toBe('function');
			});
		});
	});
});
