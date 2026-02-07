import * as crypto from 'node:crypto';
import { Config, Data, Effect, Redacted } from '@withstudiocms/effect';
import type { JwtHeader, JwtPayload, JwtVerificationResult } from '../../types.js';

/**
 * Represents errors that occur during generator operations.
 */
export class GeneratorError extends Data.TaggedError('GeneratorError')<{ cause: unknown }> {}

/**
 * A helper function to wrap generator operations in an Effect with error handling.
 *
 * @param _try - A function that performs the generator operation.
 * @returns An Effect that either yields the result of the operation or fails with a GeneratorError.
 */
export const useGeneratorError = <A>(_try: () => A) =>
	Effect.try({
		try: _try,
		catch: (error) => new GeneratorError({ cause: error }),
	});

/**
 * SDKGenerators
 *
 * Effect generator that builds a collection of utility functions used across the SDK.
 *
 * This generator:
 * - Reads the CMS encryption key from configuration (CMS_ENCRYPTION_KEY). The key's value is kept redacted for
 *   safety in logs and debug output; the generator uses the redacted value for cryptographic operations where needed.
 * - Exposes utilities for creating random IDs, secure passwords, issuing JWTs for users, and verifying JWTs.
 *
 * Exposed utilities:
 * - generateRandomIDNumber(length: number): number
 *   - Generates a numeric identifier of the specified length.
 *   - Uses Math.random() and therefore is suitable for non-cryptographic identifiers.
 *
 * - generateRandomPassword(length: number): string
 *   - Produces a password of the requested length using the character set
 *     "A-Z a-z 0-9".
 *   - Uses crypto.getRandomValues and rejection sampling to avoid modulo bias, providing cryptographically
 *     strong random selection from the character set.
 *
 * - generateToken(userId: string, noExpire?: boolean): string
 *   - Creates a signed JSON Web Token for the supplied userId.
 *   - By default the token is time-limited (expires in a short timeframe — implementation uses a 3 hour default).
 *     Passing `noExpire = true` will produce a token without the automatic expiry.
 *   - Token signing uses the CMS encryption key (redacted) via the SDK's internal JWT generation routine.
 *
 * - testToken(token: string): Effect.Effect<JwtVerificationResult, GeneratorError, never>
 *   - Validates the provided JWT using the CMS encryption key.
 *   - Verification performs:
 *     - header algorithm check (expects HS256),
 *     - expiration check (tokens with exp in the past are rejected),
 *     - signature verification (HMAC SHA-256 using the configured secret).
 *   - Returns a JwtVerificationResult indicating whether the token is valid and, if so, the userId extracted from the token.
 *
 * Error handling and effects:
 * - Many operations are wrapped with the generator's error handling helpers and may fail with GeneratorError when
 *   JSON parsing, cryptographic operations, or other wrapped computations error.
 * - Sensitive values (CMS encryption key) are handled in redacted form to avoid accidental exposure.
 *
 * Security notes:
 * - generateRandomPassword uses cryptographically secure randomness; generateRandomIDNumber does not and should not
 *   be used where cryptographic unpredictability is required.
 * - Tokens are signed and validated using HMAC-SHA256 (HS256). Ensure the configured CMS_ENCRYPTION_KEY is strong and
 *   kept secret.
 *
 * Returns:
 * - An object containing the four utilities: { generateRandomIDNumber, generateRandomPassword, generateToken, testToken }.
 *
 * Example:
 * @example
 * const sdk = yield* SDKGenerators;
 * const token = yield* sdk.generateToken('user-123');
 * const result = yield* sdk.testToken(token);
 *
 * @throws {GeneratorError} if any underlying generator-wrapped operation (parsing, crypto, config retrieval) fails.
 */
export const SDKGenerators = Effect.gen(function* () {
	/**
	 * Retrieves the CMS encryption key from the configuration, redacting its value for security.
	 */
	const redactedCMSEncryptionKey = yield* Config.redacted('CMS_ENCRYPTION_KEY');

	/**
	 * The CMS encryption key used for JWT operations, with its value redacted.
	 */
	const cmsEncryptionKey = Redacted.value(redactedCMSEncryptionKey);

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
	const base64UrlEncode = (input: string): string =>
		Buffer.from(input)
			.toString('base64') // convert to base64
			.replace(/\+/g, '-') // replace '+' with '-'
			.replace(/\//g, '_') // replace '/' with '_'
			.replace(/=+$/, ''); // remove any trailing '='

	/**
	 * Decodes a Base64URL-encoded string into its original representation.
	 *
	 * This function replaces URL-safe Base64 characters with their standard equivalents,
	 * adds necessary padding, and decodes the string using Node.js Buffer.
	 *
	 * @param input - The Base64URL-encoded string to decode.
	 * @returns The decoded string.
	 */
	const base64UrlDecode = (input: string): string => {
		let newInput = input.replace(/-/g, '+').replace(/_/g, '/');
		while (newInput.length % 4 !== 0) {
			newInput += '=';
		}
		return Buffer.from(newInput, 'base64').toString();
	};

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
	const generateJwt = Effect.fn((secret: string, payload: { userId: string }, noExpire?: boolean) =>
		useGeneratorError(() => {
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
		})
	);

	/**
	 * Verifies a JWT (JSON Web Token) using the provided secret key.
	 *
	 * @param token - The JWT string to verify.
	 * @param secret - The secret key used for verification.
	 * @returns An Effect that yields a JwtVerificationResult indicating the validity of the token.
	 */
	const verifyJwt = (
		token: string,
		secret: string
	): Effect.Effect<JwtVerificationResult, GeneratorError, never> =>
		Effect.gen(function* () {
			const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

			// Ensure the token has all three parts
			if (!encodedHeader || !encodedPayload || !encodedSignature) {
				yield* Effect.logDebug('Invalid token format');
				return { isValid: false };
			}

			// Decode header and payload
			const [header, payload] = yield* Effect.all([
				useGeneratorError<JwtHeader>(() => JSON.parse(base64UrlDecode(encodedHeader))),
				useGeneratorError<JwtPayload>(() => JSON.parse(base64UrlDecode(encodedPayload))),
			]);

			// Check if algorithm is correct
			if (header.alg !== 'HS256') {
				yield* Effect.logDebug('Invalid algorithm');
				return { isValid: false };
			}

			// Check expiration
			const currentTime = Math.floor(Date.now() / 1000);
			if (payload.exp && currentTime > payload.exp) {
				yield* Effect.logDebug('Token has expired');
				return { isValid: false };
			}

			// Verify signature
			const signatureInput = `${encodedHeader}.${encodedPayload}`;
			const generatedSignature = yield* useGeneratorError<string>(() => {
				return Buffer.from(
					crypto
						.createHmac('sha256', secret + secret)
						.update(signatureInput)
						.digest()
				).toString('base64url');
			});

			// Compare signatures
			if (generatedSignature !== encodedSignature) {
				yield* Effect.logDebug('Invalid signature');
				return { isValid: false };
			}

			// Token is valid
			return { isValid: true, userId: payload.userId };
		});

	/**
	 * Generates a random ID number of the specified length.
	 *
	 * @param length - The length of the ID number to generate.
	 * @returns A randomly generated ID number.
	 */
	const generateRandomIDNumber = Effect.fn((length: number) =>
		useGeneratorError(() => Math.floor(Math.random() * 10 ** length))
	);

	/**
	 * Generates a random password of the specified length.
	 *
	 * @param length - The length of the password to generate.
	 * @returns A randomly generated password string.
	 */
	const generateRandomPassword = Effect.fn((length: number) =>
		useGeneratorError(() => {
			// Generate a random password using uppercase, lowercase letters, and digits
			const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

			let password = '';

			// Max valid value to avoid modulo bias
			const maxValidValue = Math.floor((2 ** 32 - 1) / characters.length) * characters.length;

			// Loop until the password reaches the desired length
			while (password.length < length) {
				const n = crypto.getRandomValues(new Uint32Array(1))[0];
				if (n < maxValidValue) {
					password += characters[n % characters.length];
				}
			}

			// Return the generated password
			return password;
		})
	);

	/**
	 * Generates a JSON Web Token (JWT) for a given user ID.
	 *
	 * @param userId - The unique identifier of the user for whom the token is being generated.
	 * @returns A signed JWT string that expires in 3 hours.
	 */
	const generateToken = Effect.fn((userId: string, noExpire?: boolean) =>
		generateJwt(cmsEncryptionKey, { userId }, noExpire)
	);

	/**
	 * Tests the validity of a given JWT.
	 *
	 * @param token - The JWT string to test.
	 * @returns An Effect that yields a JwtVerificationResult indicating the validity of the token.
	 */
	const testToken = Effect.fn((token: string) => verifyJwt(token, cmsEncryptionKey));

	return {
		generateRandomIDNumber,
		generateRandomPassword,
		generateToken,
		testToken,
	};
});
