import { Effect, Schema } from 'effect';
import { genLogger, pipeLogger } from '../../../lib/effects/index.js';

/**
 * @deprecated
 */
export function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

/**
 * @deprecated
 */
export const badFormDataEntry = (title: string, description: string): Response => {
	return new Response(JSON.stringify({ error: { title, description } }), {
		status: 400,
		statusText: 'Bad Request',
		headers: {
			'Content-Type': 'application/json',
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};

export class FormDataEntryFields extends Schema.Class<FormDataEntryFields>('FormDataEntryFields')({
	title: Schema.String,
	description: Schema.String,
}) {}
export class AuthAPIUtils extends Effect.Service<AuthAPIUtils>()(
	'studiocms/routes/auth/api/shared/AuthAPIUtils',
	{
		effect: genLogger('studiocms/routes/auth/api/shared/AuthAPIUtils.effect')(function* () {
			const parseFormDataEntryToString = (formData: FormData, key: string) =>
				pipeLogger('studiocms/routes/auth/api/shared/AuthAPIUtils.parseFormDataEntryToString')(
					Effect.try(() => {
						const value = formData.get(key);
						if (typeof value !== 'string') {
							return null;
						}
						return value;
					})
				);

			const badFormDataEntry = (title: string, description: string) =>
				genLogger('studiocms/routes/auth/api/shared/AuthAPIUtils.badFormDataEntry')(function* () {
					const error = yield* Schema.decode(FormDataEntryFields)({ title, description });
					return new Response(JSON.stringify({ error }), {
						status: 400,
						statusText: 'Bad Request',
						headers: {
							'Content-Type': 'application/json',
							'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
						},
					});
				});

			return {
				parseFormDataEntryToString,
				badFormDataEntry,
			};
		}),
		accessors: true,
	}
) {
	static Provide = Effect.provide(this.Default);
}
