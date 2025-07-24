import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { z } from 'astro/zod';
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
			return {
				parseFormDataEntryToString: (formData: FormData, key: string) =>
					pipeLogger('studiocms/routes/api/auth/shared/AuthAPIUtils.parseFormDataEntryToString')(
						Effect.try(() => {
							const value = formData.get(key);
							if (typeof value !== 'string') {
								return null;
							}
							return value;
						})
					),
				badFormDataEntry: (title: string, description: string) =>
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
					}),
				readJson: ({ request }: APIContext) =>
					Effect.tryPromise({
						try: () => request.json(),
						catch: () => new AstroError('Failed to parse JSON from Request'),
					}),
				readFormData: ({ request }: APIContext) =>
					Effect.tryPromise({
						try: () => request.formData(),
						catch: () => new AstroError('Failed to parse formData from Request'),
					}),
				validateEmail: (email: string) => Effect.try({
					try: () => {
						const emailSchema = z.coerce.string().email({ message: 'Email address is invalid' });
						return emailSchema.safeParse(email);
					},
					catch: () => new AstroError('Failed to parse email with zod.')
				})
			};
		}),
	}
) {
	static Provide = Effect.provide(this.Default);
}
