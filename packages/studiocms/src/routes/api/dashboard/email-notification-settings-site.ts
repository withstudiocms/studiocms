import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';
import type { StudioCMSNotificationSettings } from '../../../virtuals/sdk/modules/config.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/email-notification-settings-site.POST')(
				function* () {
					const sdk = yield* SDKCore;

					// Get user data
					const userData = ctx.locals.StudioCMS.security?.userSessionData;

					// Check if user is logged in
					if (!userData?.isLoggedIn) {
						return apiResponseLogger(403, 'Unauthorized');
					}

					// Check if user has permission
					const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner;
					if (!isAuthorized) {
						return apiResponseLogger(403, 'Unauthorized');
					}

					yield* readAPIContextJson<unknown>(ctx).pipe(
						Effect.map((raw) => {
							const d = (raw ?? {}) as Record<string, unknown>;
							const safe = {
								emailVerification:
									typeof d.emailVerification === 'boolean' ? d.emailVerification : undefined,
								requireAdminVerification:
									typeof d.requireAdminVerification === 'boolean'
										? d.requireAdminVerification
										: undefined,
								requireEditorVerification:
									typeof d.requireEditorVerification === 'boolean'
										? d.requireEditorVerification
										: undefined,
								oAuthBypassVerification:
									typeof d.oAuthBypassVerification === 'boolean'
										? d.oAuthBypassVerification
										: undefined,
							} as Omit<StudioCMSNotificationSettings, '_config_version'>;
							return safe;
						}),
						Effect.flatMap((data) => sdk.notificationSettings.site.update(data))
					);

					return apiResponseLogger(200, 'Notification settings updated');
				}
			),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
