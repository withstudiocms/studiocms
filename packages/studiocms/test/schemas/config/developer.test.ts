import { describe, expect } from 'vitest';
import { developerConfigSchema } from '../../../src/schemas/config/developer';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Config Schemas tests (Developer)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			data: undefined,
			expected: { demoMode: false },
		},
		{
			data: { demoMode: false },
			expected: { demoMode: false },
		},
		{
			data: { demoMode: { username: 'demo_user', password: 'demo_pass' } },
			expected: { demoMode: { username: 'demo_user', password: 'demo_pass' } },
		},
		{
			data: {},
			expected: { demoMode: false },
		},
	].forEach(({ data, expected }, index) => {
		const testName = `developerConfigSchema test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:developerConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'developerConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			const result = developerConfigSchema.parse(data);
			expect(result).toEqual(expected);
		});
	});

	[
		{
			data: { demoMode: { password: 'demo_pass' } },
		},
		{
			data: { demoMode: { username: 'demo_user' } },
		},
		{
			data: { demoMode: 'invalid' as any },
		},
	].forEach(({ data }, index) => {
		const testName = `developerConfigSchema invalid data test case #${index + 1}`;
		const tags = [...sharedTags, 'schema:config', 'schema:developerConfigSchema'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'developerConfigSchema tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify(data),
				},
			});

			expect(() => developerConfigSchema.parse(data)).toThrow();
		});
	});
});
