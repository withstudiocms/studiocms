/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { describe, expect, it } from 'vitest';
import { FALLBACK_OG_IMAGE } from '../../src/components/consts.js';
import { getHeroImage, trimInput } from '../../src/components/heroHelper.js';

describe('heroHelper tests', () => {
	describe('trimInput', () => {
		it('returns undefined for null input', () => {
			expect(trimInput(null)).toBeUndefined();
		});

		it('returns undefined for undefined input', () => {
			expect(trimInput(undefined)).toBeUndefined();
		});

		it('returns undefined for empty string', () => {
			expect(trimInput('')).toBeUndefined();
		});

		it('returns undefined for string with only spaces', () => {
			expect(trimInput('   ')).toBeUndefined();
		});

		it('trims leading and trailing whitespace', () => {
			expect(trimInput('  hello world  ')).toBe('hello world');
		});

		it('returns trimmed string if non-empty after trim', () => {
			expect(trimInput('\n\tfoo bar\t\n')).toBe('foo bar');
		});

		it('returns original string if no whitespace', () => {
			expect(trimInput('baz')).toBe('baz');
		});

		describe('getHeroImage', () => {
			const mockAstro = (defaultOgImage?: string | null | undefined) => ({
				locals: {
					StudioCMS: {
						siteConfig: {
							data: {
								defaultOgImage,
							},
						},
					},
				},
			});

			it('returns trimmed hero if provided', () => {
				const Astro = mockAstro('site-og.png');
				expect(getHeroImage('  hero.png  ', Astro as any)).toBe('hero.png');
			});

			it('returns hero if provided and non-empty, ignoring site fallback', () => {
				const Astro = mockAstro('site-og.png');
				expect(getHeroImage('hero.png', Astro as any)).toBe('hero.png');
			});

			it('returns site defaultOgImage if hero is undefined', () => {
				const Astro = mockAstro('site-og.png');
				expect(getHeroImage(undefined, Astro as any)).toBe('site-og.png');
			});

			it('returns site defaultOgImage if hero is empty string', () => {
				const Astro = mockAstro('site-og.png');
				expect(getHeroImage('', Astro as any)).toBe('site-og.png');
			});

			it('returns site defaultOgImage if hero is whitespace', () => {
				const Astro = mockAstro('site-og.png');
				expect(getHeroImage('   ', Astro as any)).toBe('site-og.png');
			});

			it('returns fallback if both hero and site defaultOgImage are undefined', () => {
				const Astro = mockAstro(undefined);
				expect(getHeroImage(undefined, Astro as any)).toBe(FALLBACK_OG_IMAGE);
			});

			it('returns fallback if both hero and site defaultOgImage are empty', () => {
				const Astro = mockAstro('');
				expect(getHeroImage('', Astro as any)).toBe(FALLBACK_OG_IMAGE);
			});

			it('returns fallback if both hero and site defaultOgImage are whitespace', () => {
				const Astro = mockAstro('   ');
				expect(getHeroImage('   ', Astro as any)).toBe(FALLBACK_OG_IMAGE);
			});

			it('handles missing Astro.locals safely', () => {
				const Astro = {};
				expect(getHeroImage(undefined, Astro as any)).toBe(FALLBACK_OG_IMAGE);
			});

			it('handles missing StudioCMS config safely', () => {
				const Astro = { locals: {} };
				expect(getHeroImage(undefined, Astro as any)).toBe(FALLBACK_OG_IMAGE);
			});

			it('trims site defaultOgImage before returning', () => {
				const Astro = mockAstro('   site-og.png   ');
				expect(getHeroImage(undefined, Astro as any)).toBe('site-og.png');
			});
		});
	});
});
