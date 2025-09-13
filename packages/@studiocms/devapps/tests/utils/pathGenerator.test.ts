import { describe, expect, it } from '@effect/vitest';
import {
	ensureLeadingSlash,
	pathGenerator,
	pathWithBase,
	stripLeadingSlash,
	stripTrailingSlash,
} from '../../src/utils/pathGenerator';

describe('pathGenerator utilities', () => {
	describe('stripLeadingSlash', () => {
		it('should remove leading slash from path', () => {
			expect(stripLeadingSlash('/hello')).toBe('hello');
			expect(stripLeadingSlash('/hello/world')).toBe('hello/world');
		});

		it('should return path unchanged if no leading slash', () => {
			expect(stripLeadingSlash('hello')).toBe('hello');
			expect(stripLeadingSlash('hello/world')).toBe('hello/world');
		});

		it('should handle empty string', () => {
			expect(stripLeadingSlash('')).toBe('');
		});
	});

	describe('stripTrailingSlash', () => {
		it('should remove trailing slash from path', () => {
			expect(stripTrailingSlash('hello/')).toBe('hello');
			expect(stripTrailingSlash('hello/world/')).toBe('hello/world');
		});

		it('should return path unchanged if no trailing slash', () => {
			expect(stripTrailingSlash('hello')).toBe('hello');
			expect(stripTrailingSlash('hello/world')).toBe('hello/world');
		});

		it('should handle empty string', () => {
			expect(stripTrailingSlash('')).toBe('');
		});
	});

	describe('ensureLeadingSlash', () => {
		it('should add leading slash if missing', () => {
			expect(ensureLeadingSlash('hello')).toBe('/hello');
			expect(ensureLeadingSlash('hello/world')).toBe('/hello/world');
		});

		it('should return path unchanged if leading slash exists', () => {
			expect(ensureLeadingSlash('/hello')).toBe('/hello');
			expect(ensureLeadingSlash('/hello/world')).toBe('/hello/world');
		});

		it('should handle empty string', () => {
			expect(ensureLeadingSlash('')).toBe('/');
		});
	});

	describe('pathWithBase', () => {
		it('should combine base and path correctly', () => {
			expect(pathWithBase('hello', 'https://example.com')).toBe('https://example.com/hello');
			expect(pathWithBase('hello/world', 'https://example.com')).toBe('https://example.com/hello/world');
		});

		it('should handle empty path', () => {
			expect(pathWithBase('', 'https://example.com')).toBe('https://example.com/');
		});

		it('should strip leading slash from path', () => {
			expect(pathWithBase('/hello', 'https://example.com')).toBe('https://example.com/hello');
		});

		it('should strip trailing slash from base', () => {
			expect(pathWithBase('hello', 'https://example.com/')).toBe('https://example.com/hello');
		});
	});

	describe('pathGenerator', () => {
		it('should create path builder function', () => {
			const builder = pathGenerator('/api', 'https://example.com');

			expect(builder('test')).toBe('https://example.com/api/test');
			expect(builder('/test')).toBe('https://example.com/api/test');
			expect(builder('test/endpoint')).toBe('https://example.com/api/test/endpoint');
		});

		it('should handle base with trailing slash', () => {
			const builder = pathGenerator('/api/', 'https://example.com/');

			expect(builder('test')).toBe('https://example.com/api/test');
			expect(builder('/test')).toBe('https://example.com/api/test');
		});

		it('should handle empty endpoint path', () => {
			const builder = pathGenerator('', 'https://example.com');

			expect(builder('test')).toBe('https://example.com/test');
			expect(builder('/test')).toBe('https://example.com/test');
		});
	});
});
