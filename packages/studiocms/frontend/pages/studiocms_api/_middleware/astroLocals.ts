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
			localUser: (_) =>
				Effect.gen(function* () {
					const { locals } = yield* AstroAPIContext;
					const user = locals.StudioCMS?.security?.userSessionData;
					const userPermissionLevel = locals.StudioCMS.security?.userPermissionLevel || {
						isVisitor: false,
						isEditor: false,
						isAdmin: false,
						isOwner: false,
					};
					if (user) {
						return CurrentUser.of({
							...user,
							userPermissionLevel,
						});
					}
					return yield* new AstroLocalsMissing();
				}),
		};
	})
);
