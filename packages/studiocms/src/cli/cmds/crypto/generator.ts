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

	if (secret.length < 32) {
		console.warn('Warning: Short secret keys may compromise security');
	}

	builder.secret(secret);

	try {
		const token = builder.build();
		return convertJwtToBase64Url(token);
	} catch (err) {
		throw new Error(`Failed to build JWT token: ${(err as Error).message}`);
	}
}
