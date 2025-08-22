import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { z } from 'astro/zod';
import {
	createJsonResponse,
	Effect,
	genLogger,
	parseFormDataEntryToString,
	readAPIContextFormData,
	readAPIContextJson,
	Schema,
} from '../../../effect.js';

export class FormDataEntryFields extends Schema.Class<FormDataEntryFields>('FormDataEntryFields')({
	title: Schema.String,
	description: Schema.String,
}) {}

export class AuthAPIUtils extends Effect.Service<AuthAPIUtils>()(
	'studiocms/routes/api/auth/shared/AuthAPIUtils',
	{
		effect: genLogger('studiocms/routes/api/auth/shared/AuthAPIUtils.effect')(function* () {
			return {
				parseFormDataEntryToString: parseFormDataEntryToString,
				// biome-ignore lint/suspicious/noExplicitAny: This is a generic utility function
				readJson: (context: APIContext) => readAPIContextJson<any>(context),
				readFormData: (context: APIContext) => readAPIContextFormData(context),
				badFormDataEntry: (title: string, description: string) =>
					genLogger('studiocms/routes/api/auth/shared/AuthAPIUtils.badFormDataEntry')(function* () {
						const error = yield* Schema.decode(FormDataEntryFields)({ title, description });
						return createJsonResponse(
							{ error },
							{
								status: 400,
								statusText: 'Bad Request',
							}
						);
					}),
				validateEmail: (email: string) =>
					Effect.try({
						try: () => {
							const emailSchema = z.coerce.string().email({ message: 'Email address is invalid' });
							return emailSchema.safeParse(email);
						},
						catch: () => new AstroError('Failed to parse email with zod.'),
					}),
			};
		}),
	}
) {
	static Provide = Effect.provide(this.Default);
}
