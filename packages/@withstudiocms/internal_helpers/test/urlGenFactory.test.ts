import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { createURLGenFactory } from '../src/urlGenFactory.js';
import { parentSuiteName } from './test-utils.js';

describe(parentSuiteName, () => {
	const defaultArgs = 'dashboard';

	[
		{
			name: 'createURLGenFactory - Dashboard route with path',
			dashboard: true,
			tests: [
				{ path: 'settings', expected: '/dashboard/settings', override: undefined },
				{ path: '/settings/', expected: '/dashboard/settings', override: undefined },
				{ path: 'settings/profile', expected: '/dashboard/settings/profile', override: undefined },
			],
		},
		{
			name: 'createURLGenFactory - Dashboard route without path',
			dashboard: true,
			tests: [
				{ path: undefined, expected: '/dashboard', override: undefined },
				{ path: '', expected: '/dashboard', override: undefined },
			],
		},
		{
			name: 'createURLGenFactory - Dashboard route with override',
			dashboard: true,
			tests: [
				{ path: 'settings', override: 'admin', expected: '/admin/settings' },
				{ path: '/settings/', override: '/admin/', expected: '/admin/settings' },
				{ path: undefined, override: 'admin', expected: '/admin' },
			],
		},
		{
			name: 'createURLGenFactory - Non-dashboard route with path',
			dashboard: false,
			tests: [
				{ path: 'about', expected: '/about', override: undefined },
				{ path: '/about/', expected: '/about', override: undefined },
				{ path: 'about/team', expected: '/about/team', override: undefined },
			],
		},
		{
			name: 'createURLGenFactory - Non-dashboard route without path',
			dashboard: false,
			tests: [
				{ path: undefined, expected: '/', override: undefined },
				{ path: '', expected: '/', override: undefined },
			],
		},
		{
			name: 'createURLGenFactory - Non-dashboard route with override',
			dashboard: false,
			tests: [
				{ path: 'about', override: 'admin', expected: '/about' },
				{ path: undefined, override: '/admin/', expected: '/' },
			],
		},
	].forEach(({ name, tests, dashboard }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('createURLGenFactory Tests');
			await allure.subSuite(name);
			await allure.tags(
				'package:@withstudiocms/internal_helpers',
				'type:unit',
				'scope:withstudiocms'
			);
			await allure.parameter('defaultArgs', defaultArgs);
			await allure.parameter('dashboard', String(dashboard));
			await allure.parameter('number of tests', String(tests.length));

			const urlGen = createURLGenFactory(defaultArgs);

			tests.forEach(async ({ expected, path, override }) => {
				await allure.step(
					`Path: ${path}, Override: ${override} => Expected: ${expected}`,
					async (ctx) => {
						await ctx.parameter('path', String(path));
						await ctx.parameter('override', String(override));
						await ctx.parameter('expected', expected);
						const result = urlGen(dashboard, path, override);

						await ctx.parameter('result', result);
						expect(result).toBe(expected);
					}
				);
			});
		});
	});
});
