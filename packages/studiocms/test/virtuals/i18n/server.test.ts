import { describe, expect, it } from 'vitest';
import {
	getCurrentURLPath,
	getLangFromUrl,
	staticPaths,
	switchLanguage,
	useTranslatedPath,
	useTranslations,
} from '../../../src/virtuals/i18n/server';

// Mock AstroGlobal
function createAstroGlobal(pathname: string, referer?: string): any {
	return {
		url: new URL(`http://localhost${pathname}`),
		request: {
			headers: {
				get: (key: string) => (key === 'referer' ? referer : null),
			},
		},
	};
}

describe('i18n/server', () => {
	describe('useTranslations', () => {
		it('returns translation for given key and language', () => {
			const t = useTranslations('en', '@studiocms/auth:login');
			expect(t('title')).toBe('Login Page');
			expect(t('description')).toBe('Login Page');
		});

		it('falls back to default language if translation missing', () => {
			const t = useTranslations('en', '@studiocms/auth:login');
			// @ts-expect-error fake key
			expect(t('nonexistent')).toBe('nonexistent');
		});

		it('returns key as string if missing in all languages', () => {
			const t = useTranslations('en', '@studiocms/auth:login');
			// @ts-expect-error fake key
			expect(t('unknown')).toBe('unknown');
		});
	});

	describe('useTranslatedPath', () => {
		it('returns path without lang prefix for English when showDefaultLang is false', () => {
			const translatePath = useTranslatedPath('en');
			expect(translatePath('/dashboard')).toBe('/dashboard');
		});
	});

	describe('getLangFromUrl', () => {
		it('extracts language from URL pathname', () => {
			expect(getLangFromUrl(new URL('http://localhost/en/dashboard'))).toBe('en');
			expect(getLangFromUrl(new URL('http://localhost/dashboard'))).toBe('en');
		});

		it('returns defaultLang if language not found', () => {
			expect(getLangFromUrl(new URL('http://localhost/no/dashboard'))).toBe('en');
			expect(getLangFromUrl(new URL('http://localhost/dashboard'))).toBe('en');
		});
	});

	describe('getCurrentURLPath', () => {
		it('returns pathname without lang prefix for English paths', () => {
			const Astro = createAstroGlobal('/en/dashboard');
			expect(getCurrentURLPath(Astro)).toBe('/dashboard');
		});

		it('handles /_server-islands with explicit English', () => {
			const Astro = createAstroGlobal('/_server-islands', 'http://localhost/en/dashboard');
			expect(getCurrentURLPath(Astro)).toBe('/dashboard');
		});

		it('handles /_server-islands with default (no prefix)', () => {
			const Astro = createAstroGlobal('/_server-islands', 'http://localhost/dashboard');
			expect(getCurrentURLPath(Astro)).toBe('/dashboard');
		});
	});

	describe('switchLanguage', () => {
		it('switches path to selected language', () => {
			const Astro = createAstroGlobal('/dashboard');
			const switcher = switchLanguage(Astro);
			expect(switcher('en')).toBe('/dashboard');
		});
	});

	describe('staticPaths', () => {
		it('generates paths for English, omitting defaultLang prefix when showDefaultLang is false', () => {
			const paths = staticPaths();
			expect(paths).toContainEqual({ params: { locale: undefined } });
			expect(paths).not.toContainEqual({ params: { locale: 'en' } });
		});
	});
});
