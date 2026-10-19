import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	handlerFilter,
	matchFilterCheck,
	sortByPriority,
} from '../../../src/astro/utils/middleware.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Middleware Utility Tests';

describe(parentSuiteName, () => {
	[
		{
			paths: undefined,
			pathname: '/foo',
			defaultValue: true,
			expected: true,
		},
		{
			paths: undefined,
			pathname: '/foo',
			defaultValue: false,
			expected: false,
		},
		{
			paths: [],
			pathname: '/foo',
			defaultValue: true,
			expected: true,
		},
		{
			paths: [],
			pathname: '/foo',
			defaultValue: true,
			expected: true,
		},
		{
			paths: '',
			pathname: '/foo',
			defaultValue: true,
			expected: true,
		},
		{
			paths: '',
			pathname: '/foo',
			defaultValue: false,
			expected: false,
		},
		{
			paths: ['/foo/*', '/baz/*'],
			pathname: '/baz/bar',
			defaultValue: false,
			expected: true,
		},
		{
			paths: ['/foo/*', '/baz/*'],
			pathname: '/qux/bar',
			defaultValue: false,
			expected: false,
		},
		{
			paths: '   ',
			pathname: '/foo',
			defaultValue: false,
			expected: false,
		},
		{
			paths: ' /foo/* ',
			pathname: '/foo/bar',
			defaultValue: false,
			expected: true,
		},
	].forEach(({ paths, pathname, defaultValue, expected }) => {
		test('Middleware - matchFilterCheck', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('matchFilterCheck Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Paths', JSON.stringify(paths));
			await allure.parameter('Pathname', pathname);
			await allure.parameter('Default Value', String(defaultValue));
			await allure.parameter('Expected', String(expected));

			await allure.step('Checking matchFilterCheck result', async (ctx) => {
				const result = matchFilterCheck(paths, pathname, defaultValue);
				await ctx.parameter('Result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			includePaths: undefined,
			excludePaths: undefined,
			pathname: '/foo',
			expected: true,
		},
		{
			includePaths: undefined,
			excludePaths: undefined,
			pathname: '/bar',
			expected: true,
		},
		{
			includePaths: '/foo/*',
			excludePaths: undefined,
			pathname: '/foo/bar',
			expected: true,
		},
		{
			includePaths: '/foo/*',
			excludePaths: undefined,
			pathname: '/bar',
			expected: false,
		},
		{
			includePaths: undefined,
			excludePaths: '/foo/*',
			pathname: '/foo/bar',
			expected: false,
		},
		{
			includePaths: '/foo/*',
			excludePaths: '/foo/bar',
			pathname: '/foo/bar',
			expected: false,
		},
		{
			includePaths: '/foo/*',
			excludePaths: '/baz/*',
			pathname: '/foo/bar',
			expected: true,
		},
		{
			includePaths: ['/foo/*', '/baz/*'],
			excludePaths: '/qux/*',
			pathname: '/baz/bar',
			expected: true,
		},
		{
			includePaths: '/foo/*',
			excludePaths: undefined,
			pathname: '/baz/bar',
			expected: false,
		},
		{
			includePaths: ['/foo/*'],
			excludePaths: undefined,
			pathname: '/baz/bar',
			expected: false,
		},
		{
			includePaths: '/foo/*',
			excludePaths: '/foo/bar',
			pathname: '/foo/bar',
			expected: false,
		},
		{
			includePaths: ['/foo/*'],
			excludePaths: ['/foo/bar'],
			pathname: '/foo/bar',
			expected: false,
		},
		{
			includePaths: '',
			excludePaths: '',
			pathname: '/foo',
			expected: true,
		},
		{
			includePaths: [],
			excludePaths: [],
			pathname: '/foo',
			expected: true,
		},
		{
			includePaths: '',
			excludePaths: '/foo',
			pathname: '/foo',
			expected: false,
		},
		{
			includePaths: [],
			excludePaths: ['/foo'],
			pathname: '/foo',
			expected: false,
		},
	].forEach(({ includePaths, excludePaths, pathname, expected }) => {
		test('Middleware - handlerFilter', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('handlerFilter Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('Include Paths', JSON.stringify(includePaths));
			await allure.parameter('Exclude Paths', JSON.stringify(excludePaths));
			await allure.parameter('Pathname', pathname);
			await allure.parameter('Expected', String(expected));

			await allure.step('Checking handlerFilter result', async (ctx) => {
				const result = handlerFilter(includePaths, excludePaths, pathname);
				await ctx.parameter('Result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			a: 1,
			b: 2,
			opt: 'less-than',
		},
		{
			a: 10,
			b: 5,
			opt: 'greater-than',
		},
		{
			a: 3,
			b: 3,
			opt: 'equal',
		},
		{
			a: 1,
			b: undefined,
			opt: 'less-than',
		},
		{
			a: undefined,
			b: 1,
			opt: 'greater-than',
		},
		{
			a: 1,
			b: null,
			opt: 'less-than',
		},
		{
			a: null,
			b: 1,
			opt: 'greater-than',
		},
		{
			a: undefined,
			b: undefined,
			opt: 'equal',
		},
		{
			a: null,
			b: null,
			opt: 'equal',
		},
		{
			a: undefined,
			b: null,
			opt: 'equal',
		},
		{
			a: null,
			b: undefined,
			opt: 'equal',
		},
	].forEach(({ a, b, opt }) => {
		test('Middleware - sortByPriority', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('sortByPriority Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('A', String(a));
			await allure.parameter('B', String(b));
			await allure.parameter('Expected', opt);

			await allure.step('Checking sortByPriority result', async (ctx) => {
				const result = sortByPriority(a, b);
				let resultDesc = '';
				if (result < 0) {
					resultDesc = 'less-than';
				} else if (result > 0) {
					resultDesc = 'greater-than';
				} else {
					resultDesc = 'equal';
				}
				await ctx.parameter('Result', resultDesc);
				expect(resultDesc).toBe(opt);
			});
		});
	});
});
