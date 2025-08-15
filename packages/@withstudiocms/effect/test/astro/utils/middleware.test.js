import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handlerFilter, matchFilterCheck } from '../../../dist/astro/utils/middleware.js';

describe('Middleware Utils', () => {
	describe('matchFilterCheck', () => {
		it('matchFilterCheck: returns defaultValue if paths is undefined', () => {
			assert.equal(matchFilterCheck(undefined, '/foo', true), true);
			assert.equal(matchFilterCheck(undefined, '/foo', false), false);
		});

		it('matchFilterCheck: returns defaultValue if paths is empty array', () => {
			assert.equal(matchFilterCheck([], '/foo', true), true);
			assert.equal(matchFilterCheck([], '/foo', false), false);
		});

		it('matchFilterCheck: returns defaultValue if paths is empty string', () => {
			assert.equal(matchFilterCheck('', '/foo', true), true);
			assert.equal(matchFilterCheck('', '/foo', false), false);
		});

		it('matchFilterCheck: returns micromatch.isMatch result for string pattern', () => {
			assert.equal(matchFilterCheck('/foo/*', '/foo/bar', false), true);
			assert.equal(matchFilterCheck('/foo/*', '/baz/bar', false), false);
		});

		it('matchFilterCheck: returns micromatch.isMatch result for array of patterns', () => {
			assert.equal(matchFilterCheck(['/foo/*', '/baz/*'], '/baz/bar', false), true);
			assert.equal(matchFilterCheck(['/foo/*', '/baz/*'], '/qux/bar', false), false);
		});

		it('matchFilterCheck: trims string patterns before checking', () => {
			assert.equal(matchFilterCheck('   ', '/foo', false), false);
			assert.equal(matchFilterCheck(' /foo/* ', '/foo/bar', false), true);
		});
	});

	describe('handlerFilter', () => {
		it('handlerFilter: includes all paths if includePaths is undefined', () => {
			assert.equal(handlerFilter(undefined, undefined, '/foo'), true);
			assert.equal(handlerFilter(undefined, undefined, '/bar'), true);
		});

		it('handlerFilter: excludes no paths if excludePaths is undefined', () => {
			assert.equal(handlerFilter('/foo/*', undefined, '/foo/bar'), true);
			assert.equal(handlerFilter('/foo/*', undefined, '/bar'), false);
		});

		it('handlerFilter: returns false if pathname matches excludePaths', () => {
			assert.equal(handlerFilter(undefined, '/foo/*', '/foo/bar'), false);
			assert.equal(handlerFilter('/foo/*', '/foo/bar', '/foo/bar'), false);
		});

		it('handlerFilter: returns true if pathname matches includePaths and not excludePaths', () => {
			assert.equal(handlerFilter('/foo/*', '/baz/*', '/foo/bar'), true);
			assert.equal(handlerFilter(['/foo/*', '/baz/*'], '/qux/*', '/baz/bar'), true);
		});

		it('handlerFilter: returns false if pathname does not match includePaths', () => {
			assert.equal(handlerFilter('/foo/*', undefined, '/baz/bar'), false);
			assert.equal(handlerFilter(['/foo/*'], undefined, '/baz/bar'), false);
		});

		it('handlerFilter: returns false if pathname matches excludePaths even if included', () => {
			assert.equal(handlerFilter('/foo/*', '/foo/bar', '/foo/bar'), false);
			assert.equal(handlerFilter(['/foo/*'], ['/foo/bar'], '/foo/bar'), false);
		});

		it('handlerFilter: handles empty string and empty array for includePaths and excludePaths', () => {
			assert.equal(handlerFilter('', '', '/foo'), true);
			assert.equal(handlerFilter([], [], '/foo'), true);
			assert.equal(handlerFilter('', '/foo', '/foo'), false);
			assert.equal(handlerFilter([], ['/foo'], '/foo'), false);
		});
	});
});
