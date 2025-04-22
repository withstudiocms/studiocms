import { JWTTokenBuilder } from './builder.js';

const builder = new JWTTokenBuilder();

/**
 * Converts a JWT token to URL-safe base64 format.
 * @param jwtToken - The original JWT token to convert
 * @returns The JWT token in URL-safe base64 format
 */
export const convertJwtToBase64Url = (jwtToken: string): string =>
	Buffer.from(jwtToken).toString('base64url');

function parseClaims(claims: string[]): Record<string, any> {
	const result: Record<string, any> = {};

	for (const claim of claims) {
		const parts = claim.split('=');
		if (parts.length !== 2) {
			throw new Error(`Invalid claim format: ${claim}. Expected format: key=value`);
		}

		const key = parts[0].trim();
		const value = parts[1].trim();

		try {
			// Attempt to parse as JSON
			result[key] = JSON.parse(value);
		} catch (e) {
			// If parsing fails, use the raw string
			result[key] = value;
		}
	}

	return result;
}

/**
 * Generates a JWT token with the specified secret, claims, and expiration time.
 *
 * @param secret - The secret key used to sign the JWT token
 * @param claims - Optional array of claims in format "key=value"
 * @param exp - Optional expiration time in seconds since epoch
 * @returns The JWT token in URL-safe base64 format
 * @throws Error if secret is invalid or claims are malformed
 */
export function generator(secret: string, claims?: string[], exp?: number) {
	const finalClaims: Record<string, string> = {};

	if (claims) {
		Object.assign(finalClaims, parseClaims(claims));
	}

	try {
		builder.claims(finalClaims);
	} catch (err) {
		throw new Error((err as Error).message);
	}

	builder.iat(Math.floor(Date.now() / 1000));

	if (exp) {
		builder.exp(exp);
	}

	builder.algorithm('HS256');

	if (!secret) {
		throw new Error('Secret key missing or invalid');
	}

	if (secret.length < 32) {
		console.warn('Warning: Short secret keys may compromise security');
	}

	builder.secret(secret);

	try {
		const token = builder.build();
		return convertJwtToBase64Url(token);
	} catch (err) {
		if (err instanceof Error) {
			err.message = `Failed to build JWT token: ${err.message}`;
			throw err;
		}
		throw new Error(`Failed to build JWT token: ${err}`);
	}
}
