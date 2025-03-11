import studioCMS_SDK from 'studiocms:sdk';
import type { CombinedUserData } from 'studiocms:sdk/types';
import { StudioCMSCoreError } from '../errors.js';

const userNotificationTypes = ['account_updated'] as const;

const editorNotificationTypes = ['page_updated', 'page_deleted', 'new_page'] as const;

const adminNotificationTypes = [
	'user_updated',
	'user_deleted',
	'new_user',
	'user_deleted',
] as const;

const userNotifications = {
	account_updated: (name: string) => `${name}, your account has been updated.`,
};

const editorNotifications = {
	page_updated: (title: string) => `The page ${title} has been updated.`,
	page_deleted: (title: string) => `The page ${title} has been deleted.`,
	new_page: (title: string) => `A new page ${title} has been created.`,
};

const adminNotifications = {
	user_updated: (username: string) => `The user ${username} has been updated.`,
	user_deleted: (username: string) => `The user ${username} has been deleted.`,
	new_user: (username: string) => `A new user ${username} has been created.`,
};

type UserNotification = (typeof userNotificationTypes)[number];

type EditorNotification = (typeof editorNotificationTypes)[number];

type AdminNotification = (typeof adminNotificationTypes)[number];

type UserNotificationOptions = UserNotification[];

type EditorNotificationOptions = EditorNotification[];

type AdminNotificationOptions = AdminNotification[];

type EditorNotifications = typeof editorNotifications;

type AdminNotifications = typeof adminNotifications;

class StudioCMSNotifierError extends StudioCMSCoreError {
	name = 'StudioCMSNotifierError';
}

const userRanks = ['visitor', 'editor', 'admin', 'owner'];

const editorRanks = ['editor', 'admin', 'owner'];

const adminRanks = ['admin', 'owner'];

async function getUsersWithNotifications(
	notifications: UserNotificationOptions | EditorNotificationOptions | AdminNotificationOptions,
	userRanks: string[]
) {
	const userTable = await studioCMS_SDK.GET.database.users();

	const users = userTable.filter(
		(user) => user.permissionsData?.rank && userRanks.includes(user.permissionsData?.rank)
	);

	const usersWithEnabledNotifications: CombinedUserData[] = [];

	for (const user of users) {
		if (user.notifications?.length) {
			for (const notification of notifications) {
				if (user.notifications.includes(notification)) {
					usersWithEnabledNotifications.push(user);
				}
			}
		}
	}

	return usersWithEnabledNotifications;
}

export async function sendUserNotification<T extends UserNotification>(
	notification: T,
	userId: string
) {
	console.log('sendUserNotification', `${notification} to ${userId}`);

	const users = await getUsersWithNotifications([notification], userRanks);

	const user = users.find((user) => user.id === userId);

	if (!user) {
		throw new StudioCMSNotifierError('User not found');
	}

	console.log('User found', user);

	const message = userNotifications[notification](user.name);

	console.log('Message', message);
}

export async function sendEditorNotification<
	T extends EditorNotification,
	K extends Parameters<EditorNotifications[T]>[0],
>(notification: T, data: K) {
	console.log('sendEditorNotification', notification);

	const editors = await getUsersWithNotifications([notification], editorRanks);

	console.log('Editors found', editors);

	const message = editorNotifications[notification](data);

	console.log('Message', message);
}

export async function sendAdminNotification<
	T extends AdminNotification,
	K extends Parameters<AdminNotifications[T]>[0],
>(notification: T, data: K) {
	console.log('sendAdminNotification', notification);

	const admins = await getUsersWithNotifications([notification], adminRanks);

	console.log('Admins found', admins);

	const message = adminNotifications[notification](data);

	console.log('Message', message);
}
