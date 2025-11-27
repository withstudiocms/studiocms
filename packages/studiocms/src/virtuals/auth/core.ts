import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { type AdminNotification, Notifications } from 'studiocms:notifier';
import { SDKCoreJs as sdk } from 'studiocms:sdk';
import { AuthKit } from '@withstudiocms/auth-kit';
import { AuthKitOptions } from '@withstudiocms/auth-kit/config';
import { AuthSessionCookieName } from '../../consts.js';
import { Effect, Layer, runEffect } from '../../effect.js';

/**
 * Sends an administrative notification of the specified type with the given message.
 *
 * This effect retrieves the default notification provider and uses it to send
 * an admin notification. The operation is performed within the Effect context.
 *
 * @param type - The type of admin notification to send.
 * @param message - The message content of the notification.
 * @yields The result of sending the admin notification.
 */
const notifyAdmin = Effect.fn(function* (type: AdminNotification, message: string) {
	const notifier = yield* Notifications.pipe(Effect.provide(Notifications.Default));
	yield* notifier.sendAdminNotification(type, message);
});

// TODO: Fix this

/**
 * Configuration object for the authentication kit, providing session and user management tools.
 *
 * @remarks
 * This configuration is created using `AuthKitOptions.Live` and includes encryption, session, and user management settings.
 */
const authKitConfig = AuthKitOptions.Live({
	CMS_ENCRYPTION_KEY,
	session: {
		cookieName: AuthSessionCookieName,
		expTime: 1000 * 60 * 60 * 24 * 14,
		sessionTools: {
			createSession: async (params) => runEffect(sdk.AUTH.session.create(params)),
			deleteSession: async (sessionId) =>
				runEffect(sdk.AUTH.session.delete(sessionId)).then(() => void 0),
			sessionAndUserData: async (sessionId) =>
				runEffect(sdk.AUTH.session.sessionWithUser(sessionId)),
			updateSession: async (sessionId, params) =>
				runEffect(sdk.AUTH.session.update(sessionId, params.expiresAt)),
		},
	},
	userTools: {
		idGenerator: () => crypto.randomUUID(),
		createLocalUser: async (params) => runEffect(sdk.AUTH.user.create(params)),
		createOAuthUser: async (params) => runEffect(sdk.AUTH.oAuth.create(params)),
		getCurrentPermissions: async (userId) => runEffect(sdk.AUTH.permission.currentStatus(userId)),
		getUserById: async (id) => runEffect(sdk.GET.users.byId(id)),
		getUserByEmail: async (email) => runEffect(sdk.GET.users.byEmail(email)),
		updateLocalUser: async (id, params) => runEffect(sdk.AUTH.user.update(id, params)),
		notifier: {
			admin: (type, message) => runEffect(notifyAdmin(type, message)),
		},
	},
});

/**
 * Extracts and exports the `Encryption`, `Password`, `Session`, and `User` modules
 * from the result of running an effectful computation that provides an authentication kit.
 *
 * The effect is constructed using `Effect.gen` to yield the `AuthKit`, omitting its `_tag` property,
 * and then providing the merged configuration using `Layer.provideMerge` with `AuthKit.Default`
 * and `authKitConfig`.
 *
 * @remarks
 * This allows consumers to access core authentication utilities (encryption, password management,
 * session handling, and user management) as top-level exports.
 *
 * @see AuthKit
 * @see Effect.gen
 * @see Layer.provideMerge
 *
 * @example
 * ```typescript
 * import { Encryption, Password, Session, User } from './core';
 * ```
 */
export const { Encryption, Password, Session, User } = await runEffect(
	AuthKit.pipe(Effect.provide(Layer.provideMerge(AuthKit.Default, authKitConfig)))
);
