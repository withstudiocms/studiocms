import { cmsEncryptionKey } from 'virtual:studiocms/sdk/env';
import { Effect } from 'effect';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { type JwtVerificationResult, generateJwt, verifyJwt } from './lib/jwt-generator.js';

export class SDKCore_Generators extends Effect.Service<SDKCore_Generators>()(
	'studiocms/sdk/SDKCore_Generators',
	{
		effect: Effect.gen(function* () {
			/**
			 * Generates a random ID number with the specified length.
			 *
			 * @param length - The length of the random ID number to generate.
			 * @returns A random ID number with the specified length.
			 */
			const generateRandomIDNumber = (length: number): Effect.Effect<number, SDKCoreError, never> =>
				Effect.try({
					try: () => Math.floor(Math.random() * 10 ** length),
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`generateRandomIDNumber Error: ${error}`),
						}),
				});

			/**
			 * Generates a random password of the specified length.
			 *
			 * @param length - The length of the password to generate.
			 * @returns A randomly generated password string containing uppercase letters, lowercase letters, and digits.
			 */
			const generateRandomPassword = (length: number): Effect.Effect<string, SDKCoreError, never> =>
				Effect.try({
					try: () => {
						const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
						let password = '';
						const maxValidValue = Math.floor((2 ** 32 - 1) / characters.length) * characters.length;
						while (password.length < length) {
							const n = crypto.getRandomValues(new Uint32Array(1))[0];
							if (n < maxValidValue) {
								password += characters[n % characters.length];
							}
						}
						return password;
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`generateRandomPassword Error: ${error}`),
						}),
				});

			/**
			 * Generates a JSON Web Token (JWT) for a given user ID.
			 *
			 * @param userId - The unique identifier of the user for whom the token is being generated.
			 * @returns A signed JWT string that expires in 3 hours.
			 */
			const generateToken = (
				userId: string,
				noExpire?: boolean
			): Effect.Effect<string, SDKCoreError, never> =>
				Effect.try({
					try: () => generateJwt(cmsEncryptionKey, { userId }, noExpire),
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`generateToken Error: ${error}`),
						}),
				});

			/**
			 * Verifies the provided JWT token using the CMS encryption key.
			 *
			 * @param token - The JWT token to be verified.
			 * @returns The decoded token if verification is successful.
			 * @throws Will throw an error if the token is invalid or verification fails.
			 */
			const testToken = (
				token: string
			): Effect.Effect<JwtVerificationResult, SDKCoreError, never> =>
				Effect.try({
					try: () => verifyJwt(token, cmsEncryptionKey),
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`testToken Error: ${error}`),
						}),
				});

			return {
				generateRandomIDNumber,
				generateRandomPassword,
				generateToken,
				testToken,
			};
		}),
		accessors: true,
	}
) {}
