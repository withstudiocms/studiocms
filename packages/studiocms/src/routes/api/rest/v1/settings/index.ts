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
} from '../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export const { GET, PATCH, ALL, OPTIONS } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:settings:GET')(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const siteConfig = yield* sdk.GET.siteConfig();

				return createJsonResponse(siteConfig);
			}),
		PATCH: (ctx) =>
			genLogger('studioCMS:rest:v1:settings:PATCH')(function* () {
				const user = yield* verifyAuthTokenFromHeader(ctx);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const siteConfig = yield* readAPIContextJson<{
					title: string;
					description: string;
					loginPageBackground: string;
					loginPageCustomImage?: string;
				}>(ctx);

				if (!siteConfig.title) {
					return apiResponseLogger(400, 'Invalid form data, title is required');
				}

				if (!siteConfig.description) {
					return apiResponseLogger(400, 'Invalid form data, description is required');
				}

				if (!siteConfig.loginPageBackground) {
					return apiResponseLogger(400, 'Invalid form data, loginPageBackground is required');
				}

				if (siteConfig.loginPageBackground === 'custom' && !siteConfig.loginPageCustomImage) {
					return apiResponseLogger(400, 'Invalid form data, loginPageCustomImage is required');
				}

				const sdk = yield* SDKCore;

				yield* sdk.UPDATE.siteConfig(siteConfig);

				return apiResponseLogger(200, 'Site config updated');
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'PATCH'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'PATCH', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
