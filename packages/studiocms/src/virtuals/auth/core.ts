import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { SDKCoreJs as sdk } from 'studiocms:sdk';
import { AuthKit } from '@withstudiocms/auth-kit';
import { AuthKitOptions } from '@withstudiocms/auth-kit/config';
import type { CombinedUserData, PermissionsData } from '@withstudiocms/auth-kit/types';
import { Effect, Layer, runEffect } from '../../effect.js';

const authKitConfig = AuthKitOptions.Live({
	CMS_ENCRYPTION_KEY,
	session: {
		cookieName: 'auth_session',
		expTime: 1000 * 60 * 60 * 24 * 14,
		sessionTools: {
			createSession: async (params) => runEffect(sdk.AUTH.session.create(params)),
			deleteSession: async (sessionId) => {
				await runEffect(sdk.AUTH.session.delete(sessionId));
			},
			sessionAndUserData: async (sessionId) =>
				runEffect(sdk.AUTH.session.sessionWithUser(sessionId)),
			updateSession: async (sessionId, params) =>
				// biome-ignore lint/style/noNonNullAssertion: this variable is guaranteed to be present
				runEffect(sdk.AUTH.session.update(sessionId, params.expiresAt!)),
		},
	},
	userTools: {
		idGenerator: () => crypto.randomUUID(),
		createLocalUser: async (params) => runEffect(sdk.AUTH.user.create(params)),
		createOAuthUser: async (params) => runEffect(sdk.AUTH.oAuth.create(params)),
		getCurrentPermissions: async (userId) =>
			runEffect(sdk.AUTH.permission.currentStatus(userId)) as Promise<PermissionsData>,
		getUserById: async (id) =>
			runEffect(sdk.GET.users.byId(id)) as Promise<CombinedUserData | undefined>,
		getUserByEmail: async (email) =>
			runEffect(sdk.GET.users.byEmail(email)) as Promise<CombinedUserData | undefined>,
		updateLocalUser: async (id, params) => runEffect(sdk.AUTH.user.update(id, params)),
	},
});

export const { Encryption, Password, Session, User } = await runEffect(
	Effect.gen(function* () {
		const { _tag, ...kit } = yield* AuthKit;
		return kit;
	}).pipe(Effect.provide(Layer.provideMerge(AuthKit.Default, authKitConfig)))
);
