import { Schema } from 'effect';
import { describe, expect } from 'vitest';
import {
	AvailableDashboardPagesSchema,
	DashboardPageSchema,
	FieldSchema,
	FinalDashboardBaseSchema,
	FrontendNavigationLinksSchema,
	I18nLabelSchema,
	PageTypesSchema,
	SettingsFieldSchema,
	SettingsPageSchema,
	StudioCMSColorwaySchema,
} from '../../../src/schemas/plugins/shared';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Plugins Schemas tests (Shared)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			schemaName: 'StudioCMSColorway',
			fn: Schema.decodeUnknownSync(StudioCMSColorwaySchema),
			data: 'primary',
			shouldThrow: false,
		},
		{
			schemaName: 'StudioCMSColorway',
			fn: Schema.decodeUnknownSync(StudioCMSColorwaySchema),
			data: 'danger',
			shouldThrow: false,
		},
		{
			schemaName: 'StudioCMSColorway',
			fn: Schema.decodeUnknownSync(StudioCMSColorwaySchema),
			data: 'invalid',
			shouldThrow: true,
		},
		{
			schemaName: 'FieldSchema',
			fn: Schema.decodeUnknownSync(FieldSchema),
			data: {
				name: 'accept',
				label: 'Accept Terms',
				input: 'checkbox',
				color: 'success',
				defaultChecked: true,
				size: 'md',
			},
			shouldThrow: false,
		},
		{
			schemaName: 'FieldSchema',
			fn: Schema.decodeUnknownSync(FieldSchema),
			data: {
				name: 'username',
				label: 'Username',
				input: 'input',
				type: 'text',
				placeholder: 'Enter username',
				defaultValue: 'admin',
			},
			shouldThrow: false,
		},
		{
			schemaName: 'FieldSchema',
			fn: Schema.decodeUnknownSync(FieldSchema),
			data: { input: 'input' },
			shouldThrow: true,
		},
		{
			schemaName: 'SettingsFieldSchema',
			fn: Schema.decodeUnknownSync(SettingsFieldSchema),
			data: {
				name: 'row1',
				label: 'Row 1',
				input: 'row',
				fields: [
					{
						name: 'field1',
						label: 'Field 1',
						input: 'input',
					},
				],
			},
			shouldThrow: false,
		},
		{
			schemaName: 'I18nLabelSchema',
			fn: Schema.decodeUnknownSync(I18nLabelSchema),
			data: { en: 'Hello', fr: 'Bonjour' },
			shouldThrow: false,
		},
		{
			schemaName: 'I18nLabelSchema',
			fn: Schema.decodeUnknownSync(I18nLabelSchema),
			data: { xx: 'Unknown' },
			shouldThrow: true,
		},
		{
			schemaName: 'DashboardPageSchema',
			fn: Schema.decodeUnknownSync(DashboardPageSchema),
			data: {
				title: { en: 'Dashboard' },
				description: 'Main dashboard',
				route: '/dashboard',
				pageBodyComponent: 'DashboardBody',
				sidebar: 'single',
			},
			shouldThrow: false,
		},
		{
			schemaName: 'DashboardPageSchema',
			fn: Schema.decodeUnknownSync(DashboardPageSchema),
			data: {
				title: { en: 'Dashboard' },
				description: 'Main dashboard',
				route: '/dashboard',
				pageBodyComponent: 'DashboardBody',
				sidebar: 'double',
				innerSidebarComponent: 'InnerSidebar',
			},
			shouldThrow: false,
		},
		{
			schemaName: 'AvailableDashboardPagesSchema',
			fn: Schema.decodeUnknownSync(AvailableDashboardPagesSchema),
			data: {
				user: [
					{
						title: { en: 'User' },
						description: 'User dashboard',
						route: '/user',
						slug: 'user',
						pageBodyComponent: 'UserBody',
						sidebar: 'single',
					},
				],
				admin: [
					{
						title: { en: 'Admin' },
						description: 'Admin dashboard',
						route: '/admin',
						slug: 'admin',
						pageBodyComponent: 'AdminBody',
						sidebar: 'double',
						innerSidebarComponent: 'AdminSidebar',
					},
				],
			},
			shouldThrow: false,
		},
		{
			schemaName: 'FinalDashboardBaseSchema',
			fn: Schema.decodeUnknownSync(FinalDashboardBaseSchema),
			data: {
				title: { en: 'Final' },
				description: 'Final dashboard',
				route: '/final',
				slug: 'final',
				pageBodyComponent: 'FinalBody',
				sidebar: 'single',
				components: {
					PageBodyComponent: () => null,
				},
			},
			shouldThrow: false,
		},
	].forEach(({ fn, data, shouldThrow, schemaName }, index) => {
		const testName = `Schema test case #${index + 1} | Current Schema: ${schemaName}`;
		const tags = [...sharedTags, `schema:${schemaName}`];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'Schema Tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			await step(`Validating ${schemaName} with data: ${data}`, async () => {
				if (shouldThrow) {
					expect(() => fn(data)).toThrow();
				} else {
					expect(() => fn(data)).not.toThrow();
				}
			});
		});
	});
});
