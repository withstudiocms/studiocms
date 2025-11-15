import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest';
import type { WebVitalsResponseItem } from '../../../../src/integrations/webVitals/types';
import { buildDataObject } from '../../../../src/integrations/webVitals/utils/buildDataObject';
import { checkDate } from '../../../../src/integrations/webVitals/utils/checkDate';
import { parentSuiteName, sharedTags } from '../../../test-utils';

const localSuiteName = 'Web Vitals Utils - buildDataObject';

// Mock checkDate and its methods
vi.mock('../../../../src/integrations/webVitals/utils/checkDate', () => ({
	checkDate: vi.fn(),
}));

const mockCheckDate = (opts: {
	isInLast24Hours?: boolean;
	isInLast7Days?: boolean;
	isInLast30Days?: boolean;
}) => ({
	isInLast24Hours: () => opts.isInLast24Hours ?? false,
	isInLast7Days: () => opts.isInLast7Days ?? false,
	isInLast30Days: () => opts.isInLast30Days ?? false,
});

describe(parentSuiteName, () => {
	const collect = 'LCP';

	const baseItem = (overrides: Partial<WebVitalsResponseItem>): WebVitalsResponseItem => ({
		name: collect,
		// @ts-expect-error - testing mock data
		timestamp: new Date().toISOString(),
		value: 123,
		...overrides,
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('buildDataObject should return empty arrays when input is empty', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject empty input test');
		await allure.tags(...tags);

		const result = buildDataObject([], collect);
		expect(result).toEqual({
			historicalData: [],
			last24HoursData: [],
			last7DaysData: [],
			last30DaysData: [],
		});
	});

	test('buildDataObject should add items to historicalData if name matches collect', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject historicalData test');
		await allure.tags(...tags);

		(checkDate as unknown as Mock).mockImplementation(() => mockCheckDate({}));
		const items: WebVitalsResponseItem[] = [baseItem({ name: collect }), baseItem({ name: 'FID' })];
		const result = buildDataObject(items, collect);
		expect(result.historicalData.length).toBe(1);
		expect(result.historicalData[0].name).toBe(collect);
	});

	test('buildDataObject should add items to last24HoursData if isInLast24Hours is true', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject last24HoursData test');
		await allure.tags(...tags);

		(checkDate as unknown as Mock).mockImplementation(() =>
			mockCheckDate({ isInLast24Hours: true })
		);
		const items: WebVitalsResponseItem[] = [baseItem({})];
		const result = buildDataObject(items, collect);
		expect(result.last24HoursData.length).toBe(1);
		expect(result.last24HoursData[0].name).toBe(collect);
	});

	test('buildDataObject should add items to last7DaysData if isInLast7Days is true', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject last7DaysData test');
		await allure.tags(...tags);

		(checkDate as unknown as Mock).mockImplementation(() => mockCheckDate({ isInLast7Days: true }));
		const items: WebVitalsResponseItem[] = [baseItem({})];
		const result = buildDataObject(items, collect);
		expect(result.last7DaysData.length).toBe(1);
		expect(result.last7DaysData[0].name).toBe(collect);
	});

	test('buildDataObject should add items to last30DaysData if isInLast30Days is true', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject last30DaysData test');
		await allure.tags(...tags);

		(checkDate as unknown as Mock).mockImplementation(() =>
			mockCheckDate({ isInLast30Days: true })
		);
		const items: WebVitalsResponseItem[] = [baseItem({})];
		const result = buildDataObject(items, collect);
		expect(result.last30DaysData.length).toBe(1);
		expect(result.last30DaysData[0].name).toBe(collect);
	});

	test('buildDataObject should not add items to any array if name does not match collect', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject name mismatch test');
		await allure.tags(...tags);

		(checkDate as unknown as Mock).mockImplementation(() =>
			mockCheckDate({ isInLast24Hours: true, isInLast7Days: true, isInLast30Days: true })
		);
		const items: WebVitalsResponseItem[] = [baseItem({ name: 'FID' })];
		const result = buildDataObject(items, collect);
		expect(result.historicalData.length).toBe(0);
		expect(result.last24HoursData.length).toBe(0);
		expect(result.last7DaysData.length).toBe(0);
		expect(result.last30DaysData.length).toBe(0);
	});

	test('buildDataObject should add items to all arrays if all date checks are true', async () => {
		const tags = [
			...sharedTags,
			'integration:webVitals',
			'webVitals:utils',
			'webVitals:buildDataObject',
		];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDataObject all date checks test');
		await allure.tags(...tags);

		(checkDate as unknown as Mock).mockImplementation(() =>
			mockCheckDate({ isInLast24Hours: true, isInLast7Days: true, isInLast30Days: true })
		);
		const items: WebVitalsResponseItem[] = [baseItem({})];
		const result = buildDataObject(items, collect);
		expect(result.historicalData.length).toBe(1);
		expect(result.last24HoursData.length).toBe(1);
		expect(result.last7DaysData.length).toBe(1);
		expect(result.last30DaysData.length).toBe(1);
	});
});
