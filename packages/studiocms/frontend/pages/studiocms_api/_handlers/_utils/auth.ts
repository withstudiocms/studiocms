import {
	createJsonResponse,
	Effect,
	genLogger,
	parseFormDataEntryToString,
	readAPIContextFormData,
	readAPIContextJson,
	Schema,
} from '@withstudiocms/effect';
import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { isValidEmail } from '#schemas/external-schemas';

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
							return isValidEmail(email);
						},
						catch: () => new AstroError('Failed to parse email with zod.'),
					}),
			};
		}),
	}
) {
	static Provide = Effect.provide(this.Default);
}
