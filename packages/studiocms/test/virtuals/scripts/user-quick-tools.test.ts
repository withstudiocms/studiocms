// @vitest-environment jsdom
import { beforeEach, describe, expect } from 'vitest';
import {
	ConfigurableUserQuickTools,
	initializeWhenReady,
	isDashboardRoute,
	KNOWN_API_ROUTES,
	shouldSkipRendering,
	type UserQuickTools,
	verifyUserPermissionLevel,
} from '../../../src/virtuals/scripts/user-quick-tools';
import { allureTesterJsDom } from '../../fixtures/allureTester-jsdom';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'UserQuickTools Virtual Script tests';

describe(parentSuiteName, () => {
	const test = allureTesterJsDom({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			userLevel: 'owner',
			requiredLevel: 'owner',
			expected: true,
		},
		{
			userLevel: 'admin',
			requiredLevel: 'owner',
			expected: false,
		},
		{
			userLevel: 'admin',
			requiredLevel: 'admin',
			expected: true,
		},
		{
			userLevel: 'editor',
			requiredLevel: 'admin',
			expected: false,
		},
		{
			userLevel: 'editor',
			requiredLevel: 'editor',
			expected: true,
		},
		{
			userLevel: 'visitor',
			requiredLevel: 'editor',
			expected: false,
		},
		{
			userLevel: 'visitor',
			requiredLevel: 'visitor',
			expected: true,
		},
		{
			userLevel: 'unknown',
			requiredLevel: 'visitor',
			expected: false,
		},
	].forEach(({ userLevel, requiredLevel, expected }) => {
		const testName = `verifyUserPermissionLevel('${userLevel}', '${requiredLevel}') should return ${expected}`;
		const tags = [...sharedTags, 'virtuals:scripts', 'function:verifyUserPermissionLevel'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: testName,
				tags,
				parameters: {
					userLevel,
					requiredLevel,
					expected: String(expected),
				},
			});

			await step(
				`Testing verifyUserPermissionLevel with userLevel='${userLevel}' and requiredLevel='${requiredLevel}'`,
				async () => {
					const result = verifyUserPermissionLevel(userLevel as any, requiredLevel as any);
					expect(result).toBe(expected);
				}
			);
		});
	});

	[...KNOWN_API_ROUTES].forEach((route) => {
		const testName = `shouldSkipRendering('${route}') should return true`;
		const tags = [...sharedTags, 'virtuals:scripts', 'function:shouldSkipRendering'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: testName,
				tags,
				parameters: {
					route,
					expected: 'true',
				},
			});

			await step(`Testing shouldSkipRendering with route='${route}'`, async () => {
				const result = shouldSkipRendering(route);
				expect(result).toBe(true);
			});
		});
	});

	[
		{
			pathname: '/dashboard',
			dashboardRoute: '/dashboard',
			expected: true,
		},
		{
			pathname: '/dashboard/settings',
			dashboardRoute: '/dashboard',
			expected: true,
		},
		{
			pathname: '/profile',
			dashboardRoute: '/dashboard',
			expected: false,
		},
	].forEach(({ pathname, dashboardRoute, expected }) => {
		const testName = `isDashboardRoute('${pathname}', '${dashboardRoute}') should return ${expected}`;
		const tags = [...sharedTags, 'virtuals:scripts', 'function:isDashboardRoute'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: testName,
				tags,
				parameters: {
					pathname,
					dashboardRoute,
					expected: String(expected),
				},
			});

			await step(
				`Testing isDashboardRoute with pathname='${pathname}' and dashboardRoute='${dashboardRoute}'`,
				async () => {
					const result = isDashboardRoute(pathname, dashboardRoute);
					expect(result).toBe(expected);
				}
			);
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTesterJsDom({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = '';
		if (!customElements.get('user-quick-tools')) {
			customElements.define('user-quick-tools', ConfigurableUserQuickTools);
		}
	});

	test('UserQuickTools custom element registration', async ({ setupAllure, step }) => {
		const testName = 'custom element registration';
		const tags = [...sharedTags, 'virtuals:scripts', 'custom-element:UserQuickTools'];

		await setupAllure({
			subSuiteName: testName,
			tags,
		});

		await step('Checking custom element registration', async () => {
			expect(customElements.get('user-quick-tools')).toBeDefined();
		});
	});

	test('UserQuickTools custom element instantiation', async ({ setupAllure, step }) => {
		const testName = 'custom element instantiation';
		const tags = [...sharedTags, 'virtuals:scripts', 'custom-element:UserQuickTools'];

		await setupAllure({
			subSuiteName: testName,
			tags,
		});

		await step('Instantiating UserQuickTools element', async () => {
			document.body.innerHTML = '';
			initializeWhenReady();
			await new Promise((r) => setTimeout(r, 20));
			expect(document.querySelector('user-quick-tools')).toBeTruthy();
		});
	});

	test('UserQuickTools does not render menu if shouldSkipRendering returns true', async ({
		setupAllure,
		step,
	}) => {
		const testName = 'menu not rendered when shouldSkipRendering is true';
		const tags = [...sharedTags, 'virtuals:scripts', 'custom-element:UserQuickTools'];

		await setupAllure({
			subSuiteName: testName,
			tags,
		});

		await step('Testing menu absence when shouldSkipRendering is true', async () => {
			document.body.innerHTML = '';
			Object.defineProperty(window, 'location', {
				value: { pathname: KNOWN_API_ROUTES[0] },
				writable: true,
			});
			const el = document.createElement('user-quick-tools') as UserQuickTools;
			document.body.appendChild(el);
			el.connectedCallback();
			expect(el.shadowRoot?.querySelector('.cornerMenu')).toBeNull();
		});
	});

	test('UserQuickTools toggles menu open/close on click', async ({ setupAllure, step }) => {
		const testName = 'menu toggles open/close on click';
		const tags = [...sharedTags, 'virtuals:scripts', 'custom-element:UserQuickTools'];

		await setupAllure({
			subSuiteName: testName,
			tags,
		});

		await step('Testing menu toggle on click', async () => {
			document.body.innerHTML = '';
			const el = document.createElement('user-quick-tools') as UserQuickTools;
			document.body.appendChild(el);
			el.scheduleInitialization();
			await new Promise((r) => setTimeout(r, 50));
			const menu = el.shadowRoot?.querySelector('.cornerMenu');
			if (menu) {
				menu.dispatchEvent(new MouseEvent('click'));
				expect(menu.classList.contains('menuOpened')).toBe(true);
				menu.dispatchEvent(new MouseEvent('click'));
				expect(menu.classList.contains('menuOpened')).toBe(false);
			}
		});
	});
});
