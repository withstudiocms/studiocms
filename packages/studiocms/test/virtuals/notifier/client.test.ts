import { describe, expect } from 'vitest';
import {
	formatNotificationOptions,
	getEnabledNotificationCheckboxes,
	notificationOptions,
	type UserNotificationOptions,
} from '../../../src/virtuals/notifier/client';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Notifier Client Virtual tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('Notifier Client Virtual - notificationOptions contains expected values', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'notificationOptions test',
			tags: [...sharedTags, 'notifier:virtuals', 'constant:notificationOptions'],
		});

		await step('Checking notificationOptions contents', async () => {
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

	test('getEnabledNotificationCheckboxes - should return enabled options from FormData', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'getEnabledNotificationCheckboxes test',
			tags: [...sharedTags, 'notifier:virtuals', 'function:getEnabledNotificationCheckboxes'],
		});

		await step('Testing getEnabledNotificationCheckboxes function', async () => {
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

	test('getEnabledNotificationCheckboxes - should return empty array for no enabled options', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'getEnabledNotificationCheckboxes empty test',
			tags: [...sharedTags, 'notifier:virtuals', 'function:getEnabledNotificationCheckboxes'],
		});

		await step('Testing getEnabledNotificationCheckboxes with no enabled options', async () => {
			const formData = new FormData();
			notificationOptions.forEach((option) => {
				formData.set(option, 'off');
			});

			const result = getEnabledNotificationCheckboxes(formData);
			expect(result).toEqual([]);
		});
	});

	test('getEnabledNotificationCheckboxes - should ignore unknown keys in FormData', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'getEnabledNotificationCheckboxes ignore unknown keys test',
			tags: [...sharedTags, 'notifier:virtuals', 'function:getEnabledNotificationCheckboxes'],
		});

		await step('Testing getEnabledNotificationCheckboxes with unknown keys', async () => {
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

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: testName,
				tags,
				parameters: {
					options: options.join(', '),
					expected: expected,
				},
			});

			await step(
				`Testing formatNotificationOptions with options [${options.join(', ')}]`,
				async () => {
					const result = formatNotificationOptions(options);
					expect(result).toBe(expected);
				}
			);
		});
	});
});
