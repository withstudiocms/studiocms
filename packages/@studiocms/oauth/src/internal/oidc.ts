import * as jwt from '@withstudiocms/internal_helpers/jwt';

export function decodeIdToken(idToken: string): object {
	try {
		return jwt.decodeJWT(idToken);
	} catch (e) {
		throw new Error('Invalid ID token', {
			cause: e,
		});
	}
}
