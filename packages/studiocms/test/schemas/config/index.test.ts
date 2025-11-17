/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import { describe, expect } from 'vitest';
import { StudioCMSOptionsSchema } from '../../../src/schemas/config/index';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Config Schemas tests (Index)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('StudioCMSOptionsSchema - should parse empty config and apply defaults', async ({
		setupAllure,
		step,
	}) => {
		const tags = [...sharedTags, 'schema:config', 'schema:StudioCMSOptionsSchema'];

		await setupAllure({
			subSuiteName: 'StudioCMSOptionsSchema tests',
			tags: [...tags],
		});

		await step('Parsing empty config', async () => {
			const result = StudioCMSOptionsSchema.parse({});
			expect(result.dbStartPage).toBe(true);
			expect(result.verbose).toBe(false);
			expect(result.logLevel).toBe('Info');
			expect(result.features.injectQuickActionsMenu).toBe(true);
			expect(result.features.robotsTXT).toBe(true);
			expect(result.locale.dateLocale).toBe('en-us');
			expect(result.locale.dateTimeFormat).toEqual({
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		});
	});

	[
		{
			data: { logLevel: 'Debug' },
			expected: {
				actualKey: 'logLevel',
				actualValue: 'Debug',
			},
		},
		{
			data: { plugins: [{ name: 'test-plugin', hooks: {} }] },
			expected: {
				actualKey: 'plugins',
				actualValue: [{ name: 'test-plugin', hooks: {} }],
			},
		},
		{
			data: { componentRegistry: { header: 'HeaderComponent', footer: 'FooterComponent' } },
			expected: {
				actualKey: 'componentRegistry',
				actualValue: { header: 'HeaderComponent', footer: 'FooterComponent' },
			},
		},
		{
			data: {
				locale: {
					dateLocale: 'fr-FR',
					dateTimeFormat: { year: '2-digit', month: 'long', day: '2-digit' },
				},
			},
			expected: {
				actualKey: 'locale',
				actualValue: {
					dateLocale: 'fr-FR',
					dateTimeFormat: { year: '2-digit', month: 'long', day: '2-digit' },
				},
			},
		},
		{
			data: {
				features: {
					robotsTXT: false,
					injectQuickActionsMenu: false,
					preferredImageService: 'cloudinary-js',
				},
			},
			expected: [
				{
					actualKey: 'features.robotsTXT',
					actualValue: false,
				},
				{
					actualKey: 'features.injectQuickActionsMenu',
					actualValue: false,
				},
				{
					actualKey: 'features.preferredImageService',
					actualValue: 'cloudinary-js',
				},
			],
		},
	].forEach(({ data, expected }, index) => {
		const testName = `StudioCMSOptionsSchema specific field test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:StudioCMSOptionsSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'StudioCMSOptionsSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = StudioCMSOptionsSchema.parse(data);
			if (Array.isArray(expected)) {
				for (let i = 0; i < expected.length; i++) {
					const { actualKey, actualValue } = expected[i];
					const keys = actualKey.split('.');
					let current: any = result;
					for (const key of keys) {
						current = current[key];
					}
					expect(current).toEqual(actualValue);
				}
			} else {
				const { actualKey, actualValue } = expected;
				const keys = actualKey.split('.');
				let current: any = result;
				for (const key of keys) {
					current = current[key];
				}
				expect(current).toEqual(actualValue);
			}
		});
	});

	[
		{
			data: { logLevel: 'INVALID' as any },
		},
		{
			data: { locale: 'en-US' as any },
		},
		{
			data: { features: 'invalid' as any },
		},
	].forEach(({ data }, index) => {
		const testName = `StudioCMSOptionsSchema invalid data test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:StudioCMSOptionsSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'StudioCMSOptionsSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			expect(() => StudioCMSOptionsSchema.parse(data)).toThrow();
		});
	});
});
