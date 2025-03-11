import logger from 'studiocms:logger';
import { sendMail as _sendMail, verifyMailConnection } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import studioCMS_SDK from 'studiocms:sdk';
import type { CombinedUserData } from 'studiocms:sdk/types';
import { StudioCMSCoreError } from '../errors.js';

/**
 * Retrieves the configuration settings for StudioCMS.
 *
 * This function fetches the configuration data from the StudioCMS SDK's database.
 * If the data is not available, it returns a default configuration with a title of 'StudioCMS'
 * and mailer functionality disabled.
 *
 * @returns {Promise<{ title: string, enableMailer: boolean }>} A promise that resolves to the configuration object.
 */
async function getConfig(): Promise<{ title: string; enableMailer: boolean }> {
	const data = (await studioCMS_SDK.GET.database.config()) || {
		title: 'StudioCMS',
		enableMailer: false,
	};
	return data;
}

/**
 * An object containing notification messages for user-related events.
 */
const userNotifications = {
	account_updated: (name: string) =>
		`Hello ${name}, There has been an update to your account. If you did not make this change, please contact a system administrator.`,
};

/**
 * An object containing functions to generate notification messages for various editor events.
 */
const editorNotifications = {
	page_updated: (title: string) => `The page "${title}" has been updated.`,
	page_deleted: (title: string) => `The page "${title}" has been deleted.`,
	new_page: (title: string) => `A new page "${title}" has been created.`,
	folder_updated: (name: string) => `The folder "${name}" has been updated.`,
	folder_deleted: (name: string) => `The folder "${name}" has been deleted.`,
	new_folder: (name: string) => `A new folder "${name}" has been created.`,
};

/**
 * An object containing functions to generate notification messages for various admin events.
 */
const adminNotifications = {
	user_updated: (username: string) => `The user "${username}" has been updated.`,
	user_deleted: (username: string) => `The user "${username}" has been deleted.`,
	new_user: (username: string) => `A new user "${username}" has been created.`,
};

/**
 * An object containing notification titles for each notification type.
 */
const notificationTitleStrings = {
	account_updated: 'Account Updated',
	page_updated: 'Page Updated',
	page_deleted: 'Page Deleted',
	new_page: 'New Page',
	folder_updated: 'Folder Updated',
	folder_deleted: 'Folder Deleted',
	new_folder: 'New Folder',
	user_updated: 'User Updated',
	user_deleted: 'User Deleted',
	new_user: 'New User',
};

/**
 * The type of the `notificationTitleStrings` object.
 */
type NotificationTitle = keyof typeof notificationTitleStrings;

/**
 * The type of the `userNotifications` object.
 */
type UserNotifications = typeof userNotifications;

/**
 * The type of the `editorNotifications` object.
 */
type EditorNotifications = typeof editorNotifications;

/**
 * The type of the `adminNotifications` object.
 */
type AdminNotifications = typeof adminNotifications;

/**
 * An object containing all notification types.
 */
export const notificationTypes = {
	user: Object.keys(userNotifications),
	editor: Object.keys(editorNotifications),
	admin: Object.keys(adminNotifications),
};

/**
 * The type of the `userNotificationTypes` array.
 */
export type UserNotification = keyof UserNotifications;

/**
 * The type of the `editorNotificationTypes` array.
 */
export type EditorNotification = keyof EditorNotifications;

/**
 * The type of the `adminNotificationTypes` array.
 */
export type AdminNotification = keyof AdminNotifications;

/**
 * An error class for StudioCMS notifier errors.
 */
class StudioCMSNotifierError extends StudioCMSCoreError {
	name = 'StudioCMSNotifierError';
}

/**
 * An array of user ranks.
 */
const userRanks = ['visitor', 'editor', 'admin', 'owner'];

/**
 * An array of editor ranks.
 */
const editorRanks = ['editor', 'admin', 'owner'];

/**
 * An array of admin ranks.
 */
const adminRanks = ['admin', 'owner'];

/**
 * Retrieves users who have enabled a specific notification type and belong to specified user ranks.
 *
 * @param notification - The notification type to check for each user. It can be of type `UserNotification`, `EditorNotification`, or `AdminNotification`.
 * @param userRanks - An array of user rank strings to filter users by their rank.
 * @returns A promise that resolves to an array of `CombinedUserData` objects representing users who have the specified notification enabled and belong to the specified ranks.
 */
async function getUsersWithNotifications(
	notification: UserNotification | EditorNotification | AdminNotification,
	userRanks: string[]
): Promise<CombinedUserData[]> {
	const userTable = await studioCMS_SDK.GET.database.users();

	const users = userTable.filter(
		(user) => user.permissionsData?.rank && userRanks.includes(user.permissionsData?.rank)
	);

	const usersWithEnabledNotifications: CombinedUserData[] = [];

	for (const user of users) {
		if (user.notifications) {
			const enabledNotifications = user.notifications.split(',');
			if (enabledNotifications.includes(notification)) {
				usersWithEnabledNotifications.push(user);
			}
		}
	}

	return usersWithEnabledNotifications;
}

/**
 * Sends a notification message to a list of users via email.
 *
 * @param users - An array of user data objects. Each object should contain user information, including an email address.
 * @param config - Configuration object containing the title of the notification.
 * @param message - The message to be sent to the users.
 *
 * @returns A promise that resolves when all emails have been sent.
 */
async function sendMail({
	users,
	config: { title },
	message,
	notification,
}: {
	users: CombinedUserData[];
	config: { title: string };
	message: string;
	notification: NotificationTitle;
}): Promise<void> {
	const htmlTemplate = getTemplate('notification');
	for (const { email } of users) {
		if (!email) {
			continue;
		}
		await _sendMail({
			to: email,
			subject: `${title} - New Notification`,
			html: htmlTemplate({
				title: `New Notification - ${notificationTitleStrings[notification]}`,
				message,
			}),
		});
	}
}

/**
 * Sends a user notification if the mailer is enabled and the mail connection is verified.
 *
 * @template T - The type of the user notification.
 * @param {T} notification - The notification to be sent.
 * @param {string} userId - The ID of the user to whom the notification will be sent.
 * @throws {StudioCMSNotifierError} If there is an error verifying the mail connection or if the user is not found.
 * @returns {Promise<void>} A promise that resolves when the notification is sent or if the mailer is disabled.
 */
export async function sendUserNotification<T extends UserNotification>(
	notification: T,
	userId: string
): Promise<void> {
	const config = await getConfig();

	if (!config.enableMailer) {
		return;
	}

	const testConnection = await verifyMailConnection();

	if ('error' in testConnection) {
		logger.error(`Error verifying mail connection: ${testConnection.error}`);
		throw new StudioCMSNotifierError('Error verifying mail connection', testConnection.error);
	}

	const users = await getUsersWithNotifications(notification, userRanks);

	const user = users.find((user) => user.id === userId);

	if (!user) {
		throw new StudioCMSNotifierError('User not found');
	}

	try {
		await sendMail({
			users: [user],
			config,
			message: userNotifications[notification](user.name),
			notification,
		});
	} catch (error) {
		logger.error(`Error sending email: ${error}`);
	}
}

/**
 * Sends an editor notification if the mailer is enabled and the mail connection is verified.
 *
 * @template T - The type of the editor notification.
 * @template K - The type of the data required by the notification.
 * @param {T} notification - The type of notification to send.
 * @param {K} data - The data to include in the notification.
 * @throws {StudioCMSNotifierError} If there is an error verifying the mail connection.
 */
export async function sendEditorNotification<
	T extends EditorNotification,
	K extends Parameters<EditorNotifications[T]>[0],
>(notification: T, data: K): Promise<void> {
	const config = await getConfig();

	if (!config.enableMailer) {
		return;
	}

	const testConnection = await verifyMailConnection();

	if ('error' in testConnection) {
		logger.error(`Error verifying mail connection: ${testConnection.error}`);
		throw new StudioCMSNotifierError('Error verifying mail connection', testConnection.error);
	}

	const editors = await getUsersWithNotifications(notification, editorRanks);

	try {
		await sendMail({
			users: editors,
			config,
			message: editorNotifications[notification](data),
			notification,
		});
	} catch (error) {
		logger.error(`Error sending email: ${error}`);
	}
}

/**
 * Sends an admin notification if the mailer is enabled and the mail connection is verified.
 *
 * @template T - The type of the admin notification.
 * @template K - The type of the data required by the notification.
 * @param {T} notification - The type of notification to send.
 * @param {K} data - The data to include in the notification.
 * @throws {StudioCMSNotifierError} If there is an error verifying the mail connection.
 */
export async function sendAdminNotification<
	T extends AdminNotification,
	K extends Parameters<AdminNotifications[T]>[0],
>(notification: T, data: K): Promise<void> {
	const config = await getConfig();

	if (!config.enableMailer) {
		return;
	}

	const testConnection = await verifyMailConnection();

	if ('error' in testConnection) {
		logger.error(`Error verifying mail connection: ${testConnection.error}`);
		throw new StudioCMSNotifierError('Error verifying mail connection', testConnection.error);
	}

	const admins = await getUsersWithNotifications(notification, adminRanks);

	try {
		await sendMail({
			users: admins,
			config,
			message: adminNotifications[notification](data),
			notification,
		});
	} catch (error) {
		logger.error(`Error sending email: ${error}`);
	}
}
