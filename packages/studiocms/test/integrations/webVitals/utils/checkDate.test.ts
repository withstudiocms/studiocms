import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { checkDate } from '../../../../src/integrations/webVitals/utils/checkDate';
import { parentSuiteName, sharedTags } from '../../../test-utils';

const localSuiteName = 'Web Vitals Utils - checkDate';

describe(parentSuiteName, () => {
	const now = new Date();
	const future = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day in future

	[
		{
			calc: 2 * 60 * 60 * 1000, // 2 hours ago
			method: 'isInLast24Hours',
			expected: true,
		},
		{
			calc: 25 * 60 * 60 * 1000, // 25 hours ago
			method: 'isInLast24Hours',
			expected: false,
		},
		{
			calc: 3 * 24 * 60 * 60 * 1000, // 3 days ago
			method: 'isInLast7Days',
			expected: true,
		},
		{
			calc: 8 * 24 * 60 * 60 * 1000, // 8 days ago
			method: 'isInLast7Days',
			expected: false,
		},
		{
			calc: 15 * 24 * 60 * 60 * 1000, // 15 days ago
			method: 'isInLast30Days',
			expected: true,
		},
		{
			calc: 31 * 24 * 60 * 60 * 1000, // 31 days ago
			method: 'isInLast30Days',
			expected: false,
		},
	].forEach(({ calc, method, expected }, index) => {
		const testName = `checkDate test case #${index + 1} for method ${method}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils', 'webVitals:checkDate'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('checkDate detailed tests');
			await allure.tags(...tags);

			const date = new Date(now.getTime() - calc);
			await allure.parameter('date', date.toISOString());
			await allure.parameter('method', method);
			await allure.parameter('expected', String(expected));

			const result = checkDate(date)[method as keyof ReturnType<typeof checkDate>];
			expect(result()).toBe(expected);
		});
	});

	[
		{
			method: 'isInLast24Hours',
		},
		{
			method: 'isInLast7Days',
		},
		{
			method: 'isInLast30Days',
		},
	].forEach(({ method }, index) => {
		const testName = `checkDate future date test case #${index + 1} for method ${method}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils', 'webVitals:checkDate'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('checkDate future date tests');
			await allure.tags(...tags);

			await allure.parameter('date', future.toISOString());
			await allure.parameter('method', method);
			await allure.parameter('expected', 'false');

			const result = checkDate(future)[method as keyof ReturnType<typeof checkDate>];
			expect(result()).toBe(false);
		});
	});

	[
		{
			method: 'isInLast24Hours',
		},
		{
			method: 'isInLast7Days',
		},
		{
			method: 'isInLast30Days',
		},
	].forEach(({ method }, index) => {
		const testName = `checkDate current date test case #${index + 1} for method ${method}`;
		const tags = [...sharedTags, 'integration:webVitals', 'webVitals:utils', 'webVitals:checkDate'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('checkDate current date tests');
			await allure.tags(...tags);

			await allure.parameter('date', now.toISOString());
			await allure.parameter('method', method);
			await allure.parameter('expected', 'true');

			const result = checkDate(now)[method as keyof ReturnType<typeof checkDate>];
			expect(result()).toBe(true);
		});
	});
});
