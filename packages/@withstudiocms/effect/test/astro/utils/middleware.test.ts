import { describe, expect, it } from 'vitest';
import {
	handlerFilter,
	matchFilterCheck,
	sortByPriority,
} from '../../../src/astro/utils/middleware.js';

describe('Middleware Utils', () => {
	describe('matchFilterCheck', () => {
		it('returns defaultValue if paths is undefined', () => {
			expect(matchFilterCheck(undefined, '/foo', true)).toBe(true);
			expect(matchFilterCheck(undefined, '/foo', false)).toBe(false);
		});

		it('returns defaultValue if paths is empty array', () => {
			expect(matchFilterCheck([], '/foo', true)).toBe(true);
			expect(matchFilterCheck([], '/foo', false)).toBe(false);
		});

		it('returns defaultValue if paths is empty string', () => {
			expect(matchFilterCheck('', '/foo', true)).toBe(true);
			expect(matchFilterCheck('', '/foo', false)).toBe(false);
		});

		it('returns micromatch.isMatch result for string pattern', () => {
			expect(matchFilterCheck('/foo/*', '/foo/bar', false)).toBe(true);
			expect(matchFilterCheck('/foo/*', '/baz/bar', false)).toBe(false);
		});

		it('returns micromatch.isMatch result for array of patterns', () => {
			expect(matchFilterCheck(['/foo/*', '/baz/*'], '/baz/bar', false)).toBe(true);
			expect(matchFilterCheck(['/foo/*', '/baz/*'], '/qux/bar', false)).toBe(false);
		});

		it('trims string patterns before checking', () => {
			expect(matchFilterCheck('   ', '/foo', false)).toBe(false);
			expect(matchFilterCheck(' /foo/* ', '/foo/bar', false)).toBe(true);
		});
	});

	describe('handlerFilter', () => {
		it('includes all paths if includePaths is undefined', () => {
			expect(handlerFilter(undefined, undefined, '/foo')).toBe(true);
			expect(handlerFilter(undefined, undefined, '/bar')).toBe(true);
		});

		it('excludes no paths if excludePaths is undefined', () => {
			expect(handlerFilter('/foo/*', undefined, '/foo/bar')).toBe(true);
			expect(handlerFilter('/foo/*', undefined, '/bar')).toBe(false);
		});

		it('returns false if pathname matches excludePaths', () => {
			expect(handlerFilter(undefined, '/foo/*', '/foo/bar')).toBe(false);
			expect(handlerFilter('/foo/*', '/foo/bar', '/foo/bar')).toBe(false);
		});

		it('returns true if pathname matches includePaths and not excludePaths', () => {
			expect(handlerFilter('/foo/*', '/baz/*', '/foo/bar')).toBe(true);
			expect(handlerFilter(['/foo/*', '/baz/*'], '/qux/*', '/baz/bar')).toBe(true);
		});

		it('returns false if pathname does not match includePaths', () => {
			expect(handlerFilter('/foo/*', undefined, '/baz/bar')).toBe(false);
			expect(handlerFilter(['/foo/*'], undefined, '/baz/bar')).toBe(false);
		});

		it('returns false if pathname matches excludePaths even if included', () => {
			expect(handlerFilter('/foo/*', '/foo/bar', '/foo/bar')).toBe(false);
			expect(handlerFilter(['/foo/*'], ['/foo/bar'], '/foo/bar')).toBe(false);
		});

		it('handles empty string and empty array for includePaths and excludePaths', () => {
			expect(handlerFilter('', '', '/foo')).toBe(true);
			expect(handlerFilter([], [], '/foo')).toBe(true);
			expect(handlerFilter('', '/foo', '/foo')).toBe(false);
			expect(handlerFilter([], ['/foo'], '/foo')).toBe(false);
		});

		describe('sortByPriority', () => {
			it('sorts lower numbers before higher numbers', () => {
				expect(sortByPriority(1, 2)).toBeLessThan(0);
				expect(sortByPriority(10, 5)).toBeGreaterThan(0);
				expect(sortByPriority(3, 3)).toBe(0);
			});

			it('treats undefined as lowest priority (sorted last)', () => {
				expect(sortByPriority(1, undefined)).toBeLessThan(0);
				expect(sortByPriority(undefined, 1)).toBeGreaterThan(0);
			});

			it('treats null as lowest priority (sorted last)', () => {
				expect(sortByPriority(1, null)).toBeLessThan(0);
				expect(sortByPriority(null, 1)).toBeGreaterThan(0);
			});

			it('treats both undefined as equal', () => {
				expect(sortByPriority(undefined, undefined)).toBe(0);
			});

			it('treats both null as equal', () => {
				expect(sortByPriority(null, null)).toBe(0);
			});

			it('treats undefined and null as equal', () => {
				expect(sortByPriority(undefined, null)).toBe(0);
				expect(sortByPriority(null, undefined)).toBe(0);
			});
		});
	});
});
