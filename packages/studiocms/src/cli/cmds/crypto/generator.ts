import { JWTTokenBuilder } from './builder.js';

const builder = new JWTTokenBuilder();

/**
 * Converts a JWT token to URL-safe base64 format.
 * Replaces '/' with '_', '+' with '-', and removes '=' padding.
 *
 * @param jwtToken - The original JWT token to convert
 * @returns The JWT token in URL-safe base64 format
 */
export function convertJwtToBase64Url(jwtToken: string): string {
	// Encode the JWT token to base64
	const base64Encoded = Buffer.from(jwtToken).toString('base64');

	// Make the base64 URL-safe:
	// 1. Replace '/' with '_'
	// 2. Replace '+' with '-'
	// 3. Remove '=' padding
	return base64Encoded.replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
}

export function generator(secret: string, claims?: string[], exp?: number) {
	const finalClaims: Record<string, string> = {};

	if (claims) {
		for (const c of claims) {
			const parts = c.split('=');

			if (parts.length !== 2) {
				throw new Error(`invalid claim: ${c}`);
			}
			try {
				finalClaims[parts[0].trim()] = JSON.parse(parts[1].trim());
			} catch (e) {
				finalClaims[parts[0].trim()] = parts[1].trim();
			}
		}
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

	builder.secret(secret);

	const token = builder.build();

	return convertJwtToBase64Url(token);
}
