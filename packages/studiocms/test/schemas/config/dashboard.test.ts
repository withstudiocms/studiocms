import { describe, expect } from 'vitest';
import { dashboardConfigSchema } from '../../../src/schemas/config/dashboard';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Config Schemas tests (Dashboard)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	const _dashboardConfigSchemaExpectedResult = {
		dashboardEnabled: true,
		inject404Route: true,
		faviconURL: '/favicon.svg',
		dashboardRouteOverride: undefined,
		versionCheck: true,
	};

	[
		{
			opts: {},
			expectedResult: _dashboardConfigSchemaExpectedResult,
		},
		{
			opts: {
				dashboardEnabled: false,
				inject404Route: false,
				faviconURL: '/custom.ico',
				dashboardRouteOverride: 'admin',
				versionCheck: false,
			},
			expectedResult: {
				dashboardEnabled: false,
				inject404Route: false,
				faviconURL: '/custom.ico',
				dashboardRouteOverride: 'admin',
				versionCheck: false,
			},
		},
		{
			opts: {
				dashboardEnabled: false,
				faviconURL: '/custom.svg',
			},
			expectedResult: {
				..._dashboardConfigSchemaExpectedResult,
				dashboardEnabled: false,
				faviconURL: '/custom.svg',
			},
		},
		{
			opts: undefined,
			expectedResult: _dashboardConfigSchemaExpectedResult,
		},
	].forEach(({ opts, expectedResult }, index) => {
		const testName = `dashboardConfigSchema optional test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:dashboardConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'dashboardConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(opts),
				},
			});

			const result = dashboardConfigSchema.parse(opts);
			expect(result).toBeDefined();
			expect(result.dashboardEnabled).toBe(expectedResult.dashboardEnabled);
			expect(result.inject404Route).toBe(expectedResult.inject404Route);
			expect(result.faviconURL).toBe(expectedResult.faviconURL);
			expect(result.dashboardRouteOverride).toBe(expectedResult.dashboardRouteOverride);
			expect(result.versionCheck).toBe(expectedResult.versionCheck);
		});
	});

	[
		{
			opts: {
				dashboardEnabled: 'yes',
			},
		},
		{
			opts: {
				faviconURL: 123,
			},
		},
		{
			opts: {
				inject404Route: 'no',
			},
		},
	].forEach(({ opts }, index) => {
		const testName = `dashboardConfigSchema invalid data test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:dashboardConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'dashboardConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(opts),
				},
			});

			expect(() => dashboardConfigSchema.parse(opts)).toThrow();
		});
	});
});
