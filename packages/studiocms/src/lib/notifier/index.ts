import _logger from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import { SDKCore } from 'studiocms:sdk';
import type { CombinedUserData } from 'studiocms:sdk/types';
import { Effect } from 'effect';
import type { UserNotificationOptions } from './client.js';

/**
 * An object containing notification messages for user-related events.
 */
const userNotifications = {
	account_updated: (name: string) =>
		`Hello ${name}! There has been an update to your account. If you did not make this change, please contact a system administrator.`,
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
export const notificationTitleStrings: Record<UserNotificationOptions, string> = {
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

const forked = _logger.fork('studiocms:runtime/notifier');
export const makeLogger = Effect.succeed(forked);

export class Notifications extends Effect.Service<Notifications>()(
	'studiocms/lib/notifier/Notifications',
	{
		effect: Effect.gen(function* () {
			const MailService = yield* Mailer;
			const logger = yield* makeLogger;
			const sdk = yield* SDKCore;

			/**
			 * Retrieves the configuration settings for StudioCMS.
			 *
			 * This function fetches the configuration data from the StudioCMS SDK's database.
			 * If the data is not available, it returns a default configuration with a title of 'StudioCMS'
			 * and mailer functionality disabled.
			 */
			const getConfig = Effect.gen(function* () {
				const { data } = yield* sdk.GET.siteConfig();
				if (!data) {
					return {
						title: 'StudioCMS',
						enableMailer: false,
					};
				}
				return data;
			});

			/**
			 * Retrieves users who have enabled a specific notification type and belong to specified user ranks.
			 *
			 * @param notification - The notification type to check for each user. It can be of type `UserNotification`, `EditorNotification`, or `AdminNotification`.
			 * @param userRanks - An array of user rank strings to filter users by their rank.
			 * @returns A promise that resolves to an array of `CombinedUserData` objects representing users who have the specified notification enabled and belong to the specified ranks.
			 */
			const getUsersWithNotifications = (
				notification: UserNotification | EditorNotification | AdminNotification,
				userRanks: string[]
			) =>
				Effect.gen(function* () {
					const userTable = yield* sdk.GET.users.all();

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
				});

			/**
			 * Sends a notification message to a list of users via email.
			 *
			 * @param users - An array of user data objects. Each object should contain user information, including an email address.
			 * @param config - Configuration object containing the title of the notification.
			 * @param message - The message to be sent to the users.
			 *
			 * @returns A promise that resolves when all emails have been sent.
			 */
			const sendMail = ({
				users,
				config: { title },
				message,
				notification,
			}: {
				users: CombinedUserData[];
				config: { title: string };
				message: string;
				notification: NotificationTitle;
			}) =>
				Effect.gen(function* () {
					const htmlTemplate = getTemplate('notification');

					for (const { email } of users) {
						if (!email) continue;

						yield* MailService.sendMail({
							to: email,
							subject: `${title} - New Notification`,
							html: htmlTemplate({
								title: `New Notification - ${notificationTitleStrings[notification]}`,
								message,
							}),
						});
					}
				});

			/**
			 * Sends a user notification if the mailer is enabled and the mail connection is verified.
			 *
			 * @template T - The type of the user notification.
			 * @param {T} notification - The notification to be sent.
			 * @param {string} userId - The ID of the user to whom the notification will be sent.
			 */
			const sendUserNotification = <T extends UserNotification>(notification: T, userId: string) =>
				Effect.gen(function* () {
					const config = yield* getConfig;

					if (!config.enableMailer) return;

					const testConnection = yield* MailService.verifyMailConnection;

					if ('error' in testConnection) {
						logger.error(`Error verifying mail connection: ${testConnection.error}`);
						return;
					}

					const users = yield* getUsersWithNotifications(notification, userRanks);

					const user = users.find(({ id }) => id === userId);

					if (!user) return;

					yield* sendMail({
						users: [user],
						config,
						message: userNotifications[notification](user.name),
						notification,
					});
					return;
				});

			/**
			 * Sends an editor notification if the mailer is enabled and the mail connection is verified.
			 *
			 * @template T - The type of the editor notification.
			 * @template K - The type of the data required by the notification.
			 * @param {T} notification - The type of notification to send.
			 * @param {K} data - The data to include in the notification.
			 */
			const sendEditorNotification = <
				T extends EditorNotification,
				K extends Parameters<EditorNotifications[T]>[0],
			>(
				notification: T,
				data: K
			) =>
				Effect.gen(function* () {
					const config = yield* getConfig;

					if (!config.enableMailer) return;

					const testConnection = yield* MailService.verifyMailConnection;

					if ('error' in testConnection) {
						logger.error(`Error verifying mail connection: ${testConnection.error}`);
						return;
					}

					const editors = yield* getUsersWithNotifications(notification, editorRanks);

					yield* sendMail({
						users: editors,
						config,
						message: editorNotifications[notification](data),
						notification,
					});
					return;
				});

			/**
			 * Sends an admin notification if the mailer is enabled and the mail connection is verified.
			 *
			 * @template T - The type of the admin notification.
			 * @template K - The type of the data required by the notification.
			 * @param {T} notification - The type of notification to send.
			 * @param {K} data - The data to include in the notification.
			 */
			const sendAdminNotification = <
				T extends AdminNotification,
				K extends Parameters<AdminNotifications[T]>[0],
			>(
				notification: T,
				data: K
			) =>
				Effect.gen(function* () {
					const config = yield* getConfig;

					if (!config.enableMailer) return;

					const testConnection = yield* MailService.verifyMailConnection;

					if ('error' in testConnection) {
						logger.error(`Error verifying mail connection: ${testConnection.error}`);
						return;
					}

					const admins = yield* getUsersWithNotifications(notification, adminRanks);

					yield* sendMail({
						users: admins,
						config,
						message: adminNotifications[notification](data),
						notification,
					});
					return;
				});

			return {
				sendUserNotification,
				sendEditorNotification,
				sendAdminNotification,
			};
		}),
		dependencies: [SDKCore.Default, Mailer.Default],
	}
) {}

/**
 * Sends a user notification if the mailer is enabled and the mail connection is verified.
 *
 * @template T - The type of the user notification.
 * @param {T} notification - The notification to be sent.
 * @param {string} userId - The ID of the user to whom the notification will be sent.
 * @returns {Promise<void>} A promise that resolves when the notification is sent or if the mailer is disabled.
 * @deprecated Use the Effect Notifications Service now
 */
export async function sendUserNotification<T extends UserNotification>(
	notification: T,
	userId: string
): Promise<void> {
	const program = Effect.gen(function* () {
		const notify = yield* Notifications;
		return yield* notify.sendUserNotification(notification, userId);
	}).pipe(Effect.provide(Notifications.Default));

	return await Effect.runPromise(program);
}

/**
 * Sends an editor notification if the mailer is enabled and the mail connection is verified.
 *
 * @template T - The type of the editor notification.
 * @template K - The type of the data required by the notification.
 * @param {T} notification - The type of notification to send.
 * @param {K} data - The data to include in the notification.
 * @deprecated Use the Effect Notifications Service now
 */
export async function sendEditorNotification<
	T extends EditorNotification,
	K extends Parameters<EditorNotifications[T]>[0],
>(notification: T, data: K): Promise<void> {
	const program = Effect.gen(function* () {
		const notify = yield* Notifications;
		return yield* notify.sendEditorNotification(notification, data);
	}).pipe(Effect.provide(Notifications.Default));

	return await Effect.runPromise(program);
}

/**
 * Sends an admin notification if the mailer is enabled and the mail connection is verified.
 *
 * @template T - The type of the admin notification.
 * @template K - The type of the data required by the notification.
 * @param {T} notification - The type of notification to send.
 * @param {K} data - The data to include in the notification.
 * @deprecated Use the Effect Notifications Service now
 */
export async function sendAdminNotification<
	T extends AdminNotification,
	K extends Parameters<AdminNotifications[T]>[0],
>(notification: T, data: K): Promise<void> {
	const program = Effect.gen(function* () {
		const notify = yield* Notifications;
		return yield* notify.sendAdminNotification(notification, data);
	}).pipe(Effect.provide(Notifications.Default));

	return await Effect.runPromise(program);
}
