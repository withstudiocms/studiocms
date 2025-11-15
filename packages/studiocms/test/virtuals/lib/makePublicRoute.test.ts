import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { makePublicRoute } from '../../../src/virtuals/lib/makePublicRoute';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Make Public Route Virtual tests';

describe(parentSuiteName, () => {
	[
		{
			input: 'images',
			expected: 'public/studiocms-resources/images/',
		},
		{
			input: '/assets',
			expected: 'public/studiocms-resources//assets/',
		},
		{
			input: 'files/',
			expected: 'public/studiocms-resources/files//',
		},
		{
			input: '',
			expected: 'public/studiocms-resources//',
		},
		{
			input: 'foo/bar?baz=qux',
			expected: 'public/studiocms-resources/foo/bar?baz=qux/',
		},
	].forEach(({ input, expected }) => {
		const testName = `makePublicRoute('${input}') should return '${expected}'`;
		const tags = [...sharedTags, 'lib:virtuals', 'function:makePublicRoute'];
		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('makePublicRoute test');
			await allure.tags(...tags);

			await allure.step(`Testing makePublicRoute with input: '${input}'`, async () => {
				const result = makePublicRoute(input);
				expect(result).toBe(expected);
			});
		});
	});
});
