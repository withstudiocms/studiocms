const notificationOptions = [
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
] as const;

export type UserNotificationOptions = (typeof notificationOptions)[number];

export function getEnabledNotificationCheckboxes(formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	return notificationOptions.filter((option) => data[option] === 'on');
}
