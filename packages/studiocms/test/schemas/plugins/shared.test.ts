import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	AvailableDashboardPagesSchema,
	DashboardPageSchema,
	FieldSchema,
	FinalDashboardBaseSchema,
	FrontendNavigationLinksSchema,
	i18nLabelSchema,
	PageTypesSchema,
	SettingsFieldSchema,
	SettingsPageSchema,
	StudioCMSColorway,
} from '../../../src/schemas/plugins/shared';
import { parentSuiteName, sharedTags } from '../../../test/test-utils';

const localSuiteName = 'Plugins Schemas tests (Shared)';

describe(parentSuiteName, () => {
	[
		{
			schemaName: 'StudioCMSColorway',
			fn: StudioCMSColorway.parse,
			data: 'primary',
			shouldThrow: false,
		},
		{
			schemaName: 'StudioCMSColorway',
			fn: StudioCMSColorway.parse,
			data: 'danger',
			shouldThrow: false,
		},
		{
			schemaName: 'StudioCMSColorway',
			fn: StudioCMSColorway.parse,
			data: 'invalid',
			shouldThrow: true,
		},
		{
			schemaName: 'FieldSchema',
			fn: FieldSchema.parse,
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
			fn: FieldSchema.parse,
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
			fn: FieldSchema.parse,
			data: { input: 'input' },
			shouldThrow: true,
		},
		{
			schemaName: 'SettingsFieldSchema',
			fn: SettingsFieldSchema.parse,
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
			schemaName: 'i18nLabelSchema',
			fn: i18nLabelSchema.parse,
			data: { en: 'Hello', fr: 'Bonjour' },
			shouldThrow: false,
		},
		{
			schemaName: 'i18nLabelSchema',
			fn: i18nLabelSchema.parse,
			data: { xx: 'Unknown' },
			shouldThrow: true,
		},
		{
			schemaName: 'DashboardPageSchema',
			fn: DashboardPageSchema.parse,
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
			fn: DashboardPageSchema.parse,
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
			fn: AvailableDashboardPagesSchema.parse,
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
			fn: FinalDashboardBaseSchema.parse,
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
		{
			schemaName: 'SettingsPageSchema',
			fn: SettingsPageSchema.parse,
			data: {
				fields: [
					{
						name: 'setting1',
						label: 'Setting 1',
						input: 'input',
					},
				],
				endpoint: '/api/settings',
			},
			shouldThrow: false,
		},
		{
			schemaName: 'FrontendNavigationLinksSchema',
			fn: FrontendNavigationLinksSchema.parse,
			data: [
				{ label: 'Home', href: '/' },
				{ label: 'About', href: '/about' },
			],
			shouldThrow: false,
		},
		{
			schemaName: 'PageTypesSchema',
			fn: PageTypesSchema.parse,
			data: [
				{
					label: 'Blog',
					identifier: '@studiocms/blog',
					description: 'Blog page type',
					pageContentComponent: 'BlogContent',
					rendererComponent: 'BlogRenderer',
					fields: [
						{
							name: 'title',
							label: 'Title',
							input: 'input',
						},
					],
					apiEndpoint: '/api/blog',
				},
			],
			shouldThrow: false,
		},
	].forEach(({ fn, data, shouldThrow, schemaName }, index) => {
		const testName = `Schema test case #${index + 1} | Current Schema: ${schemaName}`;
		const tags = [...sharedTags, `schema:${schemaName}`];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Schema Tests');
			await allure.tags(...tags);

			await allure.parameter('data', JSON.stringify(data));

			await allure.step(`Validating ${schemaName} with data: ${data}`, async () => {
				if (shouldThrow) {
					expect(() => fn(data)).toThrow();
				} else {
					expect(() => fn(data)).not.toThrow();
				}
			});
		});
	});
});
