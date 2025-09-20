import { describe, expect, it } from 'vitest';
import {
	definePlugin,
	SafePluginListItemSchema,
	SafePluginListSchema,
	type StudioCMSImageService,
	StudioCMSSanitizeOptionsSchema,
} from '../../../src/schemas/plugins/index';

// Mocks for shared schemas
const mockSettingsPage = { fields: [], endpoint: '/settings' };
const mockFrontendNavigationLinks = [{ label: 'Home', href: '/' }];
const mockPageTypes = [{ type: 'blog', label: 'Blog', identifier: 'mock/block' }];

describe('StudioCMSSanitizeOptionsSchema', () => {
	it('accepts valid sanitize options', () => {
		const valid = {
			allowElements: ['div', 'span'],
			blockElements: ['script'],
			dropElements: ['iframe'],
			allowAttributes: { class: ['div', 'span'] },
			dropAttributes: { style: ['div'] },
			allowComponents: true,
			allowCustomElements: false,
			allowComments: true,
		};
		expect(StudioCMSSanitizeOptionsSchema.safeParse(valid).success).toBe(true);
	});

	it('accepts undefined (optional)', () => {
		expect(StudioCMSSanitizeOptionsSchema.safeParse(undefined).success).toBe(true);
	});

	it('rejects invalid types', () => {
		const invalid = { allowElements: 'not-an-array' };
		expect(StudioCMSSanitizeOptionsSchema.safeParse(invalid).success).toBe(false);
	});
});

describe('SafePluginListItemSchema', () => {
	it('accepts a valid plugin list item', () => {
		const valid = {
			identifier: '@studiocms/test-plugin',
			name: 'Test Plugin',
			settingsPage: mockSettingsPage,
			frontendNavigationLinks: mockFrontendNavigationLinks,
			pageTypes: mockPageTypes,
		};
		const response = SafePluginListItemSchema.safeParse(valid);
		console.log(response.error);
		expect(response.success).toBe(true);
	});

	it('rejects missing required fields', () => {
		const invalid = { name: 'Missing Identifier' };
		expect(SafePluginListItemSchema.safeParse(invalid).success).toBe(false);
	});
});

describe('SafePluginListSchema', () => {
	it('accepts an array of valid plugin list items', () => {
		const valid = [
			{
				identifier: '@studiocms/test-plugin',
				name: 'Test Plugin',
			},
			{
				identifier: '@studiocms/another-plugin',
				name: 'Another Plugin',
			},
		];
		expect(SafePluginListSchema.safeParse(valid).success).toBe(true);
	});

	it('rejects invalid plugin list items', () => {
		const invalid = [
			{
				name: 'Missing Identifier',
			},
		];
		expect(SafePluginListSchema.safeParse(invalid).success).toBe(false);
	});
});

describe('definePlugin', () => {
	it('returns the plugin options', () => {
		const plugin = definePlugin({
			identifier: '@studiocms/test-plugin',
			name: 'Test Plugin',
			studiocmsMinimumVersion: '1.0.0',
			hooks: {},
		});
		expect(plugin.identifier).toBe('@studiocms/test-plugin');
		expect(plugin.name).toBe('Test Plugin');
		expect(plugin.studiocmsMinimumVersion).toBe('1.0.0');
		expect(plugin.hooks).toEqual({});
	});
});

describe('StudioCMSImageService', () => {
	it('accepts valid props and returns a string', async () => {
		const service: StudioCMSImageService = (src, props) => {
			return `${src}?w=${props.width}&h=${props.height}&alt=${props.alt}`;
		};
		const result = await service('image.jpg', {
			alt: 'desc',
			width: 100,
			height: 200,
		});
		expect(typeof result).toBe('string');
		expect(result).toContain('image.jpg');
	});
});
