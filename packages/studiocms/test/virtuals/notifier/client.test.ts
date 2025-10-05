import { describe, expect, it } from 'vitest';
import {
	formatNotificationOptions,
	getEnabledNotificationCheckboxes,
	notificationOptions,
	type UserNotificationOptions,
} from '../../../src/virtuals/notifier/client';

describe('notificationOptions', () => {
	it('should contain all expected notification types', () => {
		expect(notificationOptions).toEqual([
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
		]);
	});
});

describe('getEnabledNotificationCheckboxes', () => {
	it('should return enabled notification options from FormData', () => {
		const formData = new FormData();
		formData.set('account_updated', 'on');
		formData.set('page_updated', 'off');
		formData.set('new_page', 'on');
		formData.set('folder_deleted', 'on');
		formData.set('user_deleted', 'off');

		const result = getEnabledNotificationCheckboxes(formData);
		expect(result).toEqual(['account_updated', 'new_page', 'folder_deleted']);
	});

	it('should return an empty array if no options are enabled', () => {
		const formData = new FormData();
		notificationOptions.forEach((option) => {
			formData.set(option, 'off');
		});
		expect(getEnabledNotificationCheckboxes(formData)).toEqual([]);
	});

	it('should ignore unknown keys in FormData', () => {
		const formData = new FormData();
		formData.set('account_updated', 'on');
		formData.set('unknown_option', 'on');
		expect(getEnabledNotificationCheckboxes(formData)).toEqual(['account_updated']);
	});
});

describe('formatNotificationOptions', () => {
	it('should format options as a comma-separated string', () => {
		const options: UserNotificationOptions[] = ['account_updated', 'new_page', 'user_deleted'];
		expect(formatNotificationOptions(options)).toBe('account_updated, new_page, user_deleted');
	});

	it('should return an empty string for an empty array', () => {
		expect(formatNotificationOptions([])).toBe('');
	});
});
