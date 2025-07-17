import crypto from 'node:crypto';
import { type ScryptOptions, scrypt } from 'node:crypto';
import {
	Brand,
	Context,
	Data,
	Effect,
	Layer,
	errorTap,
	genLogger,
	pipeLogger,
} from '../../effect.js';

const parsedN = Number.parseInt(process.env.SCRYPT_N ?? '', 10);
const SCRYPT_N = Number.isFinite(parsedN) ? Math.max(16384, parsedN) : 16384;
const parsedR = Number.parseInt(process.env.SCRYPT_R ?? '', 10);
const SCRYPT_R = Number.isFinite(parsedR) ? Math.max(8, parsedR) : 8;
const parsedP = Number.parseInt(process.env.SCRYPT_P ?? '', 10);
const SCRYPT_P = Number.isFinite(parsedP) ? Math.max(1, parsedP) : 1;

/**
 * Represents an error specific to the Scrypt operation.
 *
 * This class extends a tagged error to provide additional context
 * about errors that occur during Scrypt-related operations.
 *
 * @extends Data.TaggedError
 * @template { error: Error } - The shape of the additional error context.
 */
export class ScryptError extends Data.TaggedError('ScryptError')<{ error: Error }> {}

/**
 * Configuration options for the scrypt key derivation function.
 *
 * @property {string} salt - A cryptographic salt used to ensure uniqueness of the derived key.
 * @property {number} keylen - The desired length of the derived key in bytes.
 * @property {ScryptOptions} options - Additional options for the scrypt algorithm, such as cost parameters.
 * @extends Brand.Brand<'ScryptConfigOptions'>
 */
type ScryptConfigOptions = {
	salt: string;
	keylen: number;
	options: ScryptOptions;
} & Brand.Brand<'ScryptConfigOptions'>;

/**
 * Represents the configuration options for the scrypt algorithm.
 * This is a nominal type to ensure type safety when working with scrypt configurations.
 *
 * @remarks
 * The `Brand.nominal` utility is used to create a unique type that cannot be
 * accidentally substituted with other types, even if they have the same structure.
 *
 * @example
 * ```typescript
 * const config: ScryptConfigOptions = {
 *   N: 16384,
 *   r: 8,
 *   p: 1,
 * };
 * ```
 */
const ScryptConfigOptions = Brand.nominal<ScryptConfigOptions>();

/**
 * Represents the configuration for the Scrypt encryption algorithm.
 * This class extends a tagged context to provide a strongly-typed configuration
 * for Scrypt-based encryption within the StudioCMS application.
 *
 * @extends Context.Tag
 * @template ScryptConfig - The type of the configuration class.
 * @template ScryptConfigOptions - The type of the configuration options.
 *
 * @property {Layer} Layer - A static property that provides a pre-configured
 * ScryptConfig instance using the provided encryption key and Scrypt options.
 *
 * The configuration includes:
 * - `salt`: A unique encryption key (`CMS_ENCRYPTION_KEY`) used for hashing.
 * - `keylen`: The length of the derived key (default is 64 bytes).
 * - `options`: An object containing Scrypt-specific parameters:
 *   - `N`: CPU/memory cost parameter (`SCRYPT_N`).
 *   - `r`: Block size parameter (`SCRYPT_R`).
 *   - `p`: Parallelization parameter (`SCRYPT_P`).
 */
export class ScryptConfig extends Context.Tag('studiocms/lib/auth/utils/scrypt/ScryptConfig')<
	ScryptConfig,
	ScryptConfigOptions
>() {
	static Layer = Layer.succeed(
		this,
		this.of(
			ScryptConfigOptions({
				salt:
					process.env.CMS_ENCRYPTION_KEY ||
					(() => {
						throw new Error('CMS_ENCRYPTION_KEY is required');
					})(),
				keylen: 64,
				options: {
					N: SCRYPT_N,
					r: SCRYPT_R,
					p: SCRYPT_P,
				},
			})
		)
	);
}

/**
 * The `Scrypt` class provides a service for securely hashing passwords using the scrypt algorithm.
 * It is implemented as an Effect service and depends on the `ScryptConfig` configuration layer.
 *
 * ### Usage
 * The service exposes a function that takes a password as input and returns a derived key as a `Buffer`.
 * The hashing process is asynchronous and uses the `Effect` framework for error handling and logging.
 *
 * ### Dependencies
 * - `ScryptConfig.Layer`: Provides the configuration for the scrypt algorithm, including salt, key length, and options.
 *
 * ### Logging
 * - Logs are generated using the `genLogger` and `pipeLogger` utilities for tracing the execution flow.
 *
 * ### Errors
 * - If an error occurs during the hashing process, it is wrapped in a `ScryptError` and handled using the `Effect.fail` mechanism.
 *
 * @class Scrypt
 * @extends Effect.Service
 * @template Scrypt
 * @memberof studiocms/lib/auth/utils/scrypt
 */
export class Scrypt extends Effect.Service<Scrypt>()('studiocms/cli/utils/user-utils.Scrypt', {
	effect: genLogger('studiocms/cli/utils/user-utils.Scrypt.effect')(function* () {
		const { salt, keylen, options } = yield* ScryptConfig;
		return (password: string) =>
			pipeLogger('studiocms/cli/utils/user-utils.Scrypt.Default')(
				Effect.async<Buffer, ScryptError>((resume) => {
					const req = scrypt(password, salt, keylen, options, (error, derivedKey) => {
						if (error) {
							const toFail = new ScryptError({ error });
							resume(errorTap(Effect.fail(toFail), toFail));
						} else {
							resume(Effect.succeed(derivedKey));
						}
					});

					return req;
				})
			);
	}),
	dependencies: [ScryptConfig.Layer],
}) {}

/**
 * Hashes a plain text password using script.
 *
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = (password: string, _salt?: string) =>
	genLogger('studiocms/cli/utils/user-utils.hashPassword')(function* () {
		const scrypt = yield* Scrypt;
		const salt = _salt || crypto.randomBytes(16).toString('hex');
		const hashed = yield* scrypt(password + salt);
		return `gen1.0:${salt}:${hashed.toString('hex')}`;
	}).pipe(Effect.provide(Scrypt.Default));
