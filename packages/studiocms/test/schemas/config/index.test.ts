/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import { describe, expect, it } from 'vitest';
import { StudioCMSOptionsSchema } from '../../../src/schemas/config/index';

describe('StudioCMSOptionsSchema', () => {
	it('should parse empty config and apply defaults', () => {
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

	it('should accept custom logLevel', () => {
		const result = StudioCMSOptionsSchema.parse({ logLevel: 'Debug' });
		expect(result.logLevel).toBe('Debug');
	});

	it('should accept plugins array', () => {
		const plugins = [{ name: 'test-plugin', hooks: {} }];
		const result = StudioCMSOptionsSchema.parse({ plugins });
		expect(result.plugins).toEqual(plugins);
	});

	it('should accept custom componentRegistry', () => {
		const registry = { header: 'HeaderComponent', footer: 'FooterComponent' };
		const result = StudioCMSOptionsSchema.parse({ componentRegistry: registry });
		expect(result.componentRegistry).toEqual(registry);
	});

	it('should allow overriding locale settings', () => {
		const locale = {
			dateLocale: 'fr-FR',
			dateTimeFormat: { year: '2-digit', month: 'long', day: '2-digit' },
		};
		const result = StudioCMSOptionsSchema.parse({ locale });
		expect(result.locale.dateLocale).toBe('fr-FR');
		expect(result.locale.dateTimeFormat).toEqual(locale.dateTimeFormat);
	});

	it('should allow overriding features', () => {
		const features = {
			robotsTXT: false,
			injectQuickActionsMenu: false,
			preferredImageService: 'cloudinary-js',
		};
		const result = StudioCMSOptionsSchema.parse({ features });
		expect(result.features.robotsTXT).toBe(false);
		expect(result.features.injectQuickActionsMenu).toBe(false);
		expect(result.features.preferredImageService).toBe('cloudinary-js');
	});

	it('should reject invalid logLevel', () => {
		expect(() => StudioCMSOptionsSchema.parse({ logLevel: 'INVALID' as any })).toThrow();
	});

	it('should reject non-object locale', () => {
		expect(() => StudioCMSOptionsSchema.parse({ locale: 'en-US' as any })).toThrow();
	});

	it('should reject non-object features', () => {
		expect(() => StudioCMSOptionsSchema.parse({ features: 'invalid' as any })).toThrow();
	});
});
