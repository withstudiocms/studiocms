import * as crypto from 'node:crypto';
import logger from 'studiocms:logger';

/**
 * Encodes a given string to a Base64URL format.
 *
 * This function converts the input string to Base64, then replaces characters
 * to make the output URL-safe according to the Base64URL specification:
 * - Replaces '+' with '-'
 * - Replaces '/' with '_'
 * - Removes any trailing '=' characters
 *
 * @param input - The string to encode.
 * @returns The Base64URL-encoded string.
 */
function base64UrlEncode(input: string): string {
	return Buffer.from(input)
		.toString('base64') // convert to base64
		.replace(/\+/g, '-') // replace '+' with '-'
		.replace(/\//g, '_') // replace '/' with '_'
		.replace(/=+$/, ''); // remove any trailing '='
}

/**
 * Decodes a Base64URL-encoded string into its original representation.
 *
 * This function replaces URL-safe Base64 characters with their standard equivalents,
 * adds necessary padding, and decodes the string using Node.js Buffer.
 *
 * @param input - The Base64URL-encoded string to decode.
 * @returns The decoded string.
 */
function base64UrlDecode(input: string): string {
	let newInput = input.replace(/-/g, '+').replace(/_/g, '/');
	while (newInput.length % 4 !== 0) {
		newInput += '=';
	}
	return Buffer.from(newInput, 'base64').toString();
}

/**
 * Represents the result of verifying a JWT (JSON Web Token).
 *
 * @property isValid - Indicates whether the JWT is valid.
 * @property userId - The user ID extracted from the token, if available. This is optional and may be undefined if the token is invalid.
 */
export interface JwtVerificationResult {
	isValid: boolean;
	userId?: string; // Optional, as the userId might not be available if the token is invalid
}

/**
 * Generates a JSON Web Token (JWT) using the provided secret and payload.
 *
 * The token is signed using the HS256 algorithm. The payload must include a `userId`.
 * The token's expiration (`exp`) is set to 24 hours from the current time by default,
 * or 30 years from today if `noExpire` is `true`.
 *
 * @param secret - The secret key used to sign the JWT.
 * @param payload - An object containing the JWT payload. Must include a `userId`.
 * @param noExpire - If `true`, sets the token expiration to 30 years from now; otherwise, 24 hours.
 * @returns The generated JWT as a string.
 */
export function generateJwt(
	secret: string,
	payload: { userId: string },
	noExpire?: boolean
): string {
	const header = { alg: 'HS256', typ: 'JWT' };

	const currentDate = new Date();
	const thirtyYearsFromToday = Math.floor(
		currentDate.setFullYear(currentDate.getFullYear() + 30) / 1000
	);

	const exp = noExpire ? thirtyYearsFromToday : Math.floor(Date.now() / 1000) + 86400; // 24 hours in seconds

	const payloadObj = {
		...payload,
		iat: Math.floor(Date.now() / 1000), // Corrected iat
		exp,
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payloadObj));

	const signatureInput = `${encodedHeader}.${encodedPayload}`;
	const signature = Buffer.from(
		crypto
			.createHmac('sha256', secret + secret)
			.update(signatureInput)
			.digest()
	).toString('base64url');

	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a JWT token using the provided secret.
 *
 * This function checks the token's algorithm, expiration, and signature.
 * It expects the token to use the HS256 algorithm and verifies the signature
 * using HMAC SHA-256 with the provided secret concatenated with itself.
 *
 * @param token - The JWT token string to verify.
 * @param secret - The secret key used to verify the token's signature.
 * @returns An object indicating whether the token is valid and, if valid, the user ID.
 */
export function verifyJwt(token: string, secret: string): JwtVerificationResult {
	const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

	const header = JSON.parse(base64UrlDecode(encodedHeader));
	const payload = JSON.parse(base64UrlDecode(encodedPayload));

	// Check if algorithm is correct
	if (header.alg !== 'HS256') {
		logger.warn('Invalid algorithm');
		return { isValid: false };
	}

	const currentTime = Math.floor(Date.now() / 1000);
	if (payload.exp && currentTime > payload.exp) {
		logger.warn('Token has expired');
		return { isValid: false };
	}

	const signatureInput = `${encodedHeader}.${encodedPayload}`;
	const generatedSignature = Buffer.from(
		crypto
			.createHmac('sha256', secret + secret)
			.update(signatureInput)
			.digest()
	).toString('base64url');

	if (generatedSignature !== encodedSignature) {
		logger.warn('Invalid signature');
		return { isValid: false };
	}

	return { isValid: true, userId: payload.userId };
}
