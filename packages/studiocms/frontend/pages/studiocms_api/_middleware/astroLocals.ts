import {
	AstroLocalsMiddleware,
	AstroLocalsMissing,
	CurrentUser,
} from '@withstudiocms/api-spec/astro-context';
import { Effect, Layer } from 'effect';
import { AstroAPIContext } from 'effectify/astro/context';

/**
 * Live implementation of the Astro locals authorization middleware.
 */
export const AstroLocalsAuthLive = Layer.effect(
	AstroLocalsMiddleware,
	Effect.gen(function* () {
		return {
			localUser: (_localUser) =>
				AstroAPIContext.pipe(
					Effect.map(({ locals }) => locals.StudioCMS?.security?.userSessionData),
					Effect.flatMap((user) =>
						user ? Effect.succeed(CurrentUser.of(user)) : Effect.fail(new AstroLocalsMissing())
					)
				),
		};
	})
);
