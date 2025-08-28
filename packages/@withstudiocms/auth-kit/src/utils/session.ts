import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { Effect, pipe } from '@withstudiocms/effect';
import { SessionError, useSessionError } from '../errors.js';
import type { SessionConfig } from '../types.js';

export const defaultSessionConfig: SessionConfig = {
	expTime: 1000 * 60 * 60 * 24 * 14,
	cookieName: 'auth_session',
};

/**
 * Generates a session ID by hashing the provided token using SHA-256 and encoding it in hexadecimal format.
 */
export const makeSessionId = Effect.fn((token: string) =>
	useSessionError(() => {
		if (typeof token !== 'string') {
			throw new SessionError({ cause: 'Invalid token' });
		}
		return pipe(new TextEncoder().encode(token), sha256, encodeHexLowerCase);
	})
);

/**
 * Generates a new expiration date for a session.
 */
export const makeExpirationDate = Effect.fn((expTime: number) =>
	useSessionError(() => {
		if (typeof expTime !== 'number') {
			throw new SessionError({ cause: 'Invalid expiration time' });
		}
		return new Date(Date.now() + expTime);
	})
);
