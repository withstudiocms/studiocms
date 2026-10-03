export const notificationOptions = [
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
	'new_tag',
	'update_tag',
	'delete_tag',
	'new_category',
	'update_category',
	'delete_category',
] as const;

export type UserNotificationOptions = (typeof notificationOptions)[number];

export function getEnabledNotificationCheckboxes(formData: FormData): UserNotificationOptions[] {
	const data = Object.fromEntries(formData.entries());
	return notificationOptions.filter((option) => data[option] === 'on');
}

export function formatNotificationOptions(options: UserNotificationOptions[]): string {
	return options.join(', ');
}
