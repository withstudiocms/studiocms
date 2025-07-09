import { Effect, Schema } from 'effect';
import { genLogger, pipeLogger } from '../../../lib/effects/index.js';

export class FormDataEntryFields extends Schema.Class<FormDataEntryFields>('FormDataEntryFields')({
	title: Schema.String,
	description: Schema.String,
}) {}

export class AuthAPIUtils extends Effect.Service<AuthAPIUtils>()(
	'studiocms/routes/api/auth/shared/AuthAPIUtils',
	{
		effect: genLogger('studiocms/routes/api/auth/shared/AuthAPIUtils.effect')(function* () {
			const parseFormDataEntryToString = (formData: FormData, key: string) =>
				pipeLogger('studiocms/routes/api/auth/shared/AuthAPIUtils.parseFormDataEntryToString')(
					Effect.try(() => {
						const value = formData.get(key);
						if (typeof value !== 'string') {
							return null;
						}
						return value;
					})
				);

			const badFormDataEntry = (title: string, description: string) =>
				genLogger('studiocms/routes/api/auth/shared/AuthAPIUtils.badFormDataEntry')(function* () {
					const error = yield* Schema.decode(FormDataEntryFields)({ title, description });
					return new Response(JSON.stringify({ error }), {
						status: 400,
						statusText: 'Bad Request',
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
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
