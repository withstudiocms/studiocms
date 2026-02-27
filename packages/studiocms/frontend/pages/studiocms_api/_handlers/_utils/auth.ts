import { AuthAPIError } from '@withstudiocms/api-spec/auth';
import { Effect } from 'effect';
import { isValidEmail } from '#schemas/external-schemas';

/**
 * Utility service for authentication-related operations in the StudioCMS API.
 */
export class AuthAPIUtils extends Effect.Service<AuthAPIUtils>()(
	'studiocms/routes/api/auth/shared/AuthAPIUtils',
	{
		effect: Effect.gen(function* () {
			return {
				validateEmail: (email: string) =>
					Effect.try({
						try: () => isValidEmail(email),
						catch: () =>
							new AuthAPIError({
								error: 'Failed to validate email.',
							}),
					}),
			};
		}),
	}
) {
	static Provide = Effect.provide(this.Default);
}
