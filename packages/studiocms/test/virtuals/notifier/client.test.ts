import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	formatNotificationOptions,
	getEnabledNotificationCheckboxes,
	notificationOptions,
	type UserNotificationOptions,
} from '../../../src/virtuals/notifier/client';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Notifier Client Virtual tests';

describe(parentSuiteName, () => {
	test('Notifier Client Virtual - notificationOptions contains expected values', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('notificationOptions test');
		const tags = [...sharedTags, 'notifier:virtuals', 'constant:notificationOptions'];
		await allure.tags(...tags);

		await allure.step('Checking notificationOptions contents', async () => {
			const expectedOptions: UserNotificationOptions[] = [
				'account_updated',
				'page_updated',
				'page_deleted',
				'new_page',
				'folder_updated',
				'folder_deleted',
				'new_folder',
				'user_updated',
				'user_deleted',
				'new_user',
			];
			expect(notificationOptions).toEqual(expectedOptions);
		});
	});

	test('getEnabledNotificationCheckboxes - should return enabled options from FormData', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getEnabledNotificationCheckboxes test');
		const tags = [...sharedTags, 'notifier:virtuals', 'function:getEnabledNotificationCheckboxes'];
		await allure.tags(...tags);

		await allure.step('Testing getEnabledNotificationCheckboxes function', async () => {
			const formData = new FormData();
			formData.set('account_updated', 'on');
			formData.set('page_updated', 'off');
			formData.set('new_page', 'on');
			formData.set('folder_deleted', 'on');
			formData.set('user_deleted', 'off');

			const result = getEnabledNotificationCheckboxes(formData);
			expect(result).toEqual(['account_updated', 'new_page', 'folder_deleted']);
		});
	});

	test('getEnabledNotificationCheckboxes - should return empty array for no enabled options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getEnabledNotificationCheckboxes empty test');
		const tags = [...sharedTags, 'notifier:virtuals', 'function:getEnabledNotificationCheckboxes'];
		await allure.tags(...tags);

		await allure.step(
			'Testing getEnabledNotificationCheckboxes with no enabled options',
			async () => {
				const formData = new FormData();
				notificationOptions.forEach((option) => {
					formData.set(option, 'off');
				});

				const result = getEnabledNotificationCheckboxes(formData);
				expect(result).toEqual([]);
			}
		);
	});

	test('getEnabledNotificationCheckboxes - should ignore unknown keys in FormData', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getEnabledNotificationCheckboxes ignore unknown keys test');
		const tags = [...sharedTags, 'notifier:virtuals', 'function:getEnabledNotificationCheckboxes'];
		await allure.tags(...tags);

		await allure.step('Testing getEnabledNotificationCheckboxes with unknown keys', async () => {
			const formData = new FormData();
			formData.set('account_updated', 'on');
			formData.set('unknown_option', 'on');

			const result = getEnabledNotificationCheckboxes(formData);
			expect(result).toEqual(['account_updated']);
		});
	});

	[
		{
			options: ['account_updated', 'new_page', 'user_deleted'] as UserNotificationOptions[],
			expected: 'account_updated, new_page, user_deleted',
		},
		{
			options: [] as UserNotificationOptions[],
			expected: '',
		},
	].forEach(({ options, expected }) => {
		const testName = `formatNotificationOptions should format [${options.join(
			', '
		)}] as "${expected}"`;
		const tags = [...sharedTags, 'notifier:virtuals', 'function:formatNotificationOptions'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.parameter('options', JSON.stringify(options));
			await allure.parameter('expected', expected);

			await allure.step(
				`Testing formatNotificationOptions with options [${options.join(', ')}]`,
				async () => {
					const result = formatNotificationOptions(options);
					expect(result).toBe(expected);
				}
			);
		});
	});
});
