import { SDKCore } from 'studiocms:sdk';
import templateEngine from 'studiocms:template-engine';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/templates.POST')(function* () {
				const [sdk, { templates }, engine] = yield* Effect.all([
					SDKCore,
					readAPIContextJson<{ templates: Record<string, string> }>(ctx),
					templateEngine,
				]);

				const keys = engine.availableTemplates;
				type Keys = (typeof keys)[number];
				const updates: Partial<Record<Keys, string>> = {};
				for (const key of keys) {
					if (key in templates) {
						updates[key] = templates[key];
					}
				}

				if (Object.keys(updates).length === 0) {
					return createJsonResponse(
						{ message: 'No valid templates provided for update.' },
						{ status: 400 }
					);
				}

				const updatedConfig = yield* sdk.CONFIG.templateConfig.update(updates);
				if (!updatedConfig) {
					return createJsonResponse({ error: 'Failed to update templates.' }, { status: 500 });
				}

				return new Response('ok', { status: 200, headers: { 'Content-Type': 'application/json' } });
			}),
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
