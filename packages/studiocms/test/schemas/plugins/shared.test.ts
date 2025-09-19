import { describe, expect, it } from 'vitest';
import {
	AvailableDashboardPagesSchema,
	DashboardPageSchema,
	FieldSchema,
	FinalDashboardBaseSchema,
	FrontendNavigationLinksSchema,
	type GridItem,
	type GridItemInput,
	type GridItemUsable,
	i18nLabelSchema,
	PageTypeDefaultsOrString,
	PageTypesSchema,
	SettingsFieldSchema,
	SettingsPageSchema,
	StudioCMSColorway,
} from '../../../src/schemas/plugins/shared';

describe('StudioCMSColorway', () => {
	it('should allow valid colorway values', () => {
		expect(() => StudioCMSColorway.parse('primary')).not.toThrow();
		expect(() => StudioCMSColorway.parse('danger')).not.toThrow();
	});

	it('should reject invalid colorway values', () => {
		expect(() => StudioCMSColorway.parse('invalid')).toThrow();
	});
});

describe('FieldSchema', () => {
	it('should validate a checkbox field', () => {
		const data = {
			name: 'accept',
			label: 'Accept Terms',
			input: 'checkbox',
			color: 'success',
			defaultChecked: true,
			size: 'md',
		};
		expect(() => FieldSchema.parse(data)).not.toThrow();
	});

	it('should validate a text input field', () => {
		const data = {
			name: 'username',
			label: 'Username',
			input: 'input',
			type: 'text',
			placeholder: 'Enter username',
			defaultValue: 'admin',
		};
		expect(() => FieldSchema.parse(data)).not.toThrow();
	});

	it('should reject field with missing required properties', () => {
		expect(() => FieldSchema.parse({ input: 'input' })).toThrow();
	});
});

describe('SettingsFieldSchema', () => {
	it('should validate a row field with nested fields', () => {
		const data = {
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
		};
		expect(() => SettingsFieldSchema.parse(data)).not.toThrow();
	});
});

describe('i18nLabelSchema', () => {
	it('should accept valid locale keys', () => {
		const valid = { en: 'Title', fr: 'Titre' };
		expect(() => i18nLabelSchema.parse(valid)).not.toThrow();
	});

	it('should reject unknown locale keys', () => {
		const invalid = { xx: 'Unknown' };
		expect(() => i18nLabelSchema.parse(invalid)).toThrow();
	});
});

describe('DashboardPageSchema', () => {
	it('should validate single sidebar page', () => {
		const data = {
			title: { en: 'Dashboard' },
			description: 'Main dashboard',
			route: '/dashboard',
			pageBodyComponent: 'DashboardBody',
			sidebar: 'single',
		};
		expect(() => DashboardPageSchema.parse(data)).not.toThrow();
	});

	it('should validate double sidebar page', () => {
		const data = {
			title: { en: 'Dashboard' },
			description: 'Main dashboard',
			route: '/dashboard',
			pageBodyComponent: 'DashboardBody',
			sidebar: 'double',
			innerSidebarComponent: 'InnerSidebar',
		};
		expect(() => DashboardPageSchema.parse(data)).not.toThrow();
	});
});

describe('AvailableDashboardPagesSchema', () => {
	it('should validate available dashboard pages', () => {
		const data = {
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
		};
		expect(() => AvailableDashboardPagesSchema.parse(data)).not.toThrow();
	});
});

describe('FinalDashboardBaseSchema', () => {
	it('should validate final dashboard base schema', () => {
		const data = {
			title: { en: 'Final' },
			description: 'Final dashboard',
			route: '/final',
			slug: 'final',
			pageBodyComponent: 'FinalBody',
			sidebar: 'single',
			components: {
				PageBodyComponent: () => null,
			},
		};
		expect(() => FinalDashboardBaseSchema.parse(data)).not.toThrow();
	});
});

describe('PageTypeDefaultsOrString', () => {
	it('should accept default values', () => {
		expect(() => PageTypeDefaultsOrString.parse('studiocms/markdown')).not.toThrow();
		expect(() => PageTypeDefaultsOrString.parse('studiocms/html')).not.toThrow();
	});

	it('should accept arbitrary string', () => {
		expect(() => PageTypeDefaultsOrString.parse('custom/type')).not.toThrow();
	});
});

describe('SettingsPageSchema', () => {
	it('should validate settings page schema', () => {
		const data = {
			fields: [
				{
					name: 'setting1',
					label: 'Setting 1',
					input: 'input',
				},
			],
			endpoint: '/api/settings',
		};
		expect(() => SettingsPageSchema.parse(data)).not.toThrow();
	});
});

describe('FrontendNavigationLinksSchema', () => {
	it('should validate navigation links', () => {
		const data = [
			{ label: 'Home', href: '/' },
			{ label: 'Docs', href: '/docs' },
		];
		expect(() => FrontendNavigationLinksSchema.parse(data)).not.toThrow();
	});
});

describe('PageTypesSchema', () => {
	it('should validate page types', () => {
		const data = [
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
		];
		expect(() => PageTypesSchema.parse(data)).not.toThrow();
	});
});

describe('GridItemInput', () => {
	it('should allow valid GridItemInput', () => {
		const item: GridItemInput = {
			name: 'item1',
			span: 2,
			variant: 'default',
			requiresPermission: 'admin',
			header: { title: 'Header', icon: 'heroicons:cube-transparent' },
			body: { html: '<div>Body</div>' },
		};
		expect(item.name).toBe('item1');
		expect(item.span).toBe(2);
		expect(item.variant).toBe('default');
	});
});

describe('GridItemUsable', () => {
	it('should allow valid GridItemUsable', () => {
		const item: GridItemUsable = {
			name: 'item2',
			span: 1,
			variant: 'filled',
			header: { title: 'Header' },
			body: { html: '<div>Body</div>' },
		};
		expect(item.variant).toBe('filled');
	});
});

describe('GridItem', () => {
	it('should allow valid GridItem', () => {
		const item: GridItem = {
			name: 'item3',
			span: 3,
			variant: 'default',
			enabled: true,
		};
		expect(item.enabled).toBe(true);
	});
});
