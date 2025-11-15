import { describe, expect } from 'vitest';
import { providerData, showOAuth } from '../../src/frontend/components/shared/oAuthButtonProviders';
import {
	allowedIdentifiers,
	sortByDate,
	withinLast30Days,
} from '../../src/handlers/plugin-components/utils';
import { allureTester } from '../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Components Utils tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('allowedIdentifiers matches expected values', async ({ setupAllure }) => {
		const tags = [...sharedTags, 'component:default-grid-items', 'utils:allowedIdentifiers'];

		await setupAllure({
			subSuiteName: 'allowedIdentifiers test',
			tags: [...tags],
		});

		const result = allowedIdentifiers;
		const expected = [
			'studiocms/markdown',
			'studiocms/html',
			'studiocms/mdx',
			'studiocms/markdoc',
			'studiocms/wysiwyg',
		];

		expect(result).toEqual(expected);
	});

	[
		{
			subtract: 10,
			expected: true,
		},
		{
			subtract: 31,
			expected: false,
		},
		{
			add: 1,
			expected: true,
		},
	].forEach(({ subtract, add, expected }, index) => {
		const testName = `withinLast30Days test case #${index + 1}`;
		test(testName, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'component:default-grid-items', 'utils:withinLast30Days'];

			await setupAllure({
				subSuiteName: 'withinLast30Days test',
				tags: [...tags],
			});

			const testDate = new Date();
			if (subtract) {
				testDate.setDate(testDate.getDate() - subtract);
			}
			if (add) {
				testDate.setDate(testDate.getDate() + add);
			}

			const result = withinLast30Days(testDate);
			expect(result).toBe(expected);
		});
	});

	const _ADate = new Date('2023-01-01');
	const _BDate = new Date('2023-02-01');

	[
		{
			a: _ADate,
			b: _BDate,
			expected: 'greaterThan',
		},
		{
			a: _BDate,
			b: _ADate,
			expected: 'lessThan',
		},
		{
			a: _ADate,
			b: _ADate,
			expected: 'equal',
		},
		{
			a: _ADate,
			b: _BDate,
			desc: true,
			expected: 'lessThan',
		},
		{
			a: _BDate,
			b: _ADate,
			desc: true,
			expected: 'greaterThan',
		},
		{
			a: _ADate,
			b: _ADate,
			desc: true,
			expected: 'equal',
		},
		{
			a: null,
			b: _ADate,
			expected: 'greaterThan',
		},
		{
			a: _ADate,
			b: null,
			expected: 'lessThan',
		},
		{
			a: null,
			b: null,
			expected: 'equal',
		},
	].forEach(({ a, b, desc, expected }, index) => {
		const testName = `sortByDate test case #${index + 1}`;

		test(testName, async ({ setupAllure }) => {
			const tags = [...sharedTags, 'component:default-grid-items', 'utils:sortByDate'];

			await setupAllure({
				subSuiteName: 'sortByDate test',
				tags: [...tags],
			});

			const result = sortByDate(a, b, desc);
			if (expected === 'greaterThan') {
				expect(result).toBeGreaterThan(0);
			} else if (expected === 'lessThan') {
				expect(result).toBeLessThan(0);
			} else {
				expect(result).toBe(0);
			}
		});
	});

	test('oAuthButtonProviders should map oAuthButtons to providerData correctly', async ({
		setupAllure,
	}) => {
		const tags = [...sharedTags, 'component:oAuthButtonProviders', 'utils:providerData'];

		await setupAllure({
			subSuiteName: 'oAuthButtonProviders - providerData test',
			tags: [...tags],
		});

		expect(providerData).toEqual([
			{
				enabled: true,
				href: '/studiocms_api/auth/github',
				label: 'GitHub',
				image: 'github.png',
			},
			{
				enabled: false,
				href: '/studiocms_api/auth/discord',
				label: 'Discord',
				image: 'discord.png',
			},
		]);
	});

	test('oAuthButtonProviders should set showOAuth to true if any provider is enabled', async ({
		setupAllure,
	}) => {
		const tags = [...sharedTags, 'component:oAuthButtonProviders', 'utils:showOAuth'];

		await setupAllure({
			subSuiteName: 'oAuthButtonProviders - showOAuth test',
			tags: [...tags],
		});

		expect(showOAuth).toBe(true);
	});
});
