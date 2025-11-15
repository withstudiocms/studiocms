import { describe, expect } from 'vitest';
import {
	apiRoute,
	makeAPIRoute,
	restRoute,
	sdkRouteResolver,
	v1RestRoute,
} from '../../../src/virtuals/lib/makeAPIRoute';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Make API Route Virtual tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			input: 'users',
			cases: [
				{
					input: 'profile',
					expected: '/studiocms_api/users/profile',
				},
				{
					input: 'settings',
					expected: '/studiocms_api/users/settings',
				},
			],
		},
		{
			input: 'base',
			cases: [
				{
					input: '',
					expected: '/studiocms_api/base/',
				},
			],
		},
		{
			input: '',
			cases: [
				{
					input: 'test',
					expected: '/studiocms_api//test',
				},
			],
		},
	].forEach(({ input, cases }) => {
		cases.forEach(({ input: pathInput, expected }) => {
			const testName = `makeAPIRoute('${input}')('${pathInput}') should return '${expected}'`;
			const tags = [...sharedTags, 'lib:virtuals', 'function:makeAPIRoute'];
			test(testName, async ({ setupAllure, step }) => {
				await setupAllure({
					subSuiteName: 'makeAPIRoute test',
					tags: [...tags],
				});

				await step(
					`Testing makeAPIRoute with route: '${input}' and path: '${pathInput}'`,
					async () => {
						const routeFunction = makeAPIRoute(input);
						const result = routeFunction(pathInput);
						expect(result).toBe(expected);
					}
				);
			});
		});
	});

	[
		{
			input: 'init',
			expected: '/studiocms_api/sdk/init',
		},
		{
			input: 'status',
			expected: '/studiocms_api/sdk/status',
		},
	].forEach(({ input, expected }) => {
		const testName = `sdkRouteResolver('${input}') should return '${expected}'`;
		const tags = [...sharedTags, 'lib:virtuals', 'function:sdkRouteResolver'];
		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'sdkRouteResolver test',
				tags: [...tags],
			});

			await step(`Testing sdkRouteResolver with input: '${input}'`, async () => {
				const result = sdkRouteResolver(input);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'render',
			expected: '/studiocms_api/renderer/render',
		},
		{
			input: 'preview',
			expected: '/studiocms_api/renderer/preview',
		},
	].forEach(({ input, expected }) => {
		const testName = `apiRoute('${input}') should return '${expected}'`;
		const tags = [...sharedTags, 'lib:virtuals', 'function:apiRoute'];
		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'apiRoute test',
				tags: [...tags],
			});

			await step(`Testing apiRoute with input: '${input}'`, async () => {
				const result = apiRoute(input);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			version: 'v1',
			route: 'users',
			expected: '/studiocms_api/rest/v1/users',
		},
		{
			version: 'v2',
			route: 'posts',
			expected: '/studiocms_api/rest/v2/posts',
		},
	].forEach(({ version, route, expected }) => {
		const testName = `restRoute('${version}')('${route}') should return '${expected}'`;
		const tags = [...sharedTags, 'lib:virtuals', 'function:restRoute'];
		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'restRoute test',
				tags: [...tags],
			});

			await step(`Testing restRoute with version: '${version}' and route: '${route}'`, async () => {
				// @ts-expect-error testing invalid version
				const routeFunction = restRoute(version);
				const result = routeFunction(route);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'comments',
			expected: '/studiocms_api/rest/v1/comments',
		},
		{
			input: 'likes',
			expected: '/studiocms_api/rest/v1/likes',
		},
	].forEach(({ input, expected }) => {
		const testName = `v1RestRoute('${input}') should return '${expected}'`;
		const tags = [...sharedTags, 'lib:virtuals', 'function:v1RestRoute'];
		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'v1RestRoute test',
				tags: [...tags],
			});

			await step(`Testing v1RestRoute with input: '${input}'`, async () => {
				const result = v1RestRoute(input);
				expect(result).toBe(expected);
			});
		});
	});
});
