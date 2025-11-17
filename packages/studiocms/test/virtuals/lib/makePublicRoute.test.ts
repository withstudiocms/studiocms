import { describe, expect } from 'vitest';
import { makePublicRoute } from '../../../src/virtuals/lib/makePublicRoute';
import { allureTester } from '../../fixtures/allureTester';
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
		allureTester({
			suiteName: localSuiteName,
			suiteParentName: parentSuiteName,
		})(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'makePublicRoute test',
				tags: [...tags],
			});

			await step(`Testing makePublicRoute with input: '${input}'`, async () => {
				const result = makePublicRoute(input);
				expect(result).toBe(expected);
			});
		});
	});
});
