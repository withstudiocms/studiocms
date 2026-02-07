import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { Effect, pipe } from '@withstudiocms/effect';
import { useSessionError } from '../errors.js';
import type { SessionConfig } from '../types.js';

/**
 * The default configuration for user sessions.
 *
 * @remarks
 * - `expTime` sets the session expiration time in milliseconds (default: 14 days).
 * - `cookieName` specifies the name of the cookie used to store the session.
 *
 * @example
 * // Use the default session configuration
 * app.useSession(defaultSessionConfig);
 */
export const defaultSessionConfig: SessionConfig = {
	expTime: 1000 * 60 * 60 * 24 * 14,
	cookieName: 'auth_session',
};

/**
 * Generates a session ID by hashing the provided token using SHA-256 and encoding it in hexadecimal format.
 */
export const makeSessionId = Effect.fn((token: string) =>
	useSessionError(() => {
		// runtime guard for JS callers
		if (typeof token !== 'string' || token.length === 0) {
			throw new TypeError('Invalid token');
		}
		return pipe(new TextEncoder().encode(token), sha256, encodeHexLowerCase);
	})
);

/**
 * Generates a new expiration date for a session.
 */
export const makeExpirationDate = Effect.fn((expTime: number) =>
	useSessionError(() => {
		if (!Number.isFinite(expTime) || expTime <= 0) {
			throw new TypeError('Invalid expiration time');
		}
		return new Date(Date.now() + expTime);
	})
);
