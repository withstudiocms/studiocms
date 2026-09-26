import { type BinaryLike, type ScryptOptions, scrypt } from 'node:crypto';
import * as Brand from 'effect/Brand';
import * as Context from 'effect/Context';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

/**
 * Represents an error specific to the Scrypt operation.
 *
 * This class extends a tagged error to provide additional context
 * about errors that occur during Scrypt-related operations.
 *
 * @extends Data.TaggedError
 */
export class ScryptError extends Data.TaggedError('effectify/scrypt.ScryptError')<{
	error: unknown;
}> {}

/**
 * Configuration options for the Scrypt key derivation function.
 *
 * @remarks
 * This type is branded to ensure type safety and prevent accidental misuse.
 *
 * @property encryptionKey - The secret key used for encryption.
 * @property keylen - The desired length of the derived key in bytes.
 * @property options - Additional options for the Scrypt algorithm.
 */
export type ScryptConfigOptions = {
	keylen: number;
	options: ScryptOptions;
} & Brand.Brand<'effectify/scrypt.ScryptConfigOptions'>;

/**
 * Represents the configuration options for the Scrypt algorithm.
 * This is a nominal type to ensure type safety when working with Scrypt configurations.
 *
 * @remarks
 * The `Brand.nominal` utility is used to create a unique type that cannot be
 * accidentally substituted with other types, even if they have the same structure.
 *
 * @example
 * ```typescript
 * const config: ScryptConfigOptions = {
 *   keylen: 64,
 *   options: { N: 16384, r: 8, p: 1 },
 * };
 * ```
 */
export const ScryptConfigOptions = Brand.nominal<ScryptConfigOptions>();

/**
 * Context for Scrypt configuration.
 *
 * This context holds the Scrypt configuration options and provides a way to access them
 * throughout the application.
 *
 * @extends Context.Tag
 * @template {ScryptConfig} - The type of the context.
 */
export class ScryptConfig extends Context.Tag('effectify/scrypt.ScryptConfig')<
	ScryptConfig,
	ScryptConfigOptions
>() {
	static Make = (opts: ScryptConfigOptions) => Layer.succeed(this, ScryptConfigOptions(opts));
}

/**
 * Scrypt service for key derivation.
 *
 * This service provides methods to derive keys using the Scrypt algorithm.
 * It uses the configuration provided by the ScryptConfig context.
 *
 * @extends Effect.Service
 * @template {Scrypt} - The type of the service.
 */
export class Scrypt extends Effect.Service<Scrypt>()('effectify/scrypt.Scrypt', {
	effect: Effect.gen(function* () {
		const { keylen, options } = yield* ScryptConfig;

		return Effect.fn('effectify/scrypt.Scrypt.run')((password: BinaryLike, salt: BinaryLike) =>
			Effect.async<Buffer, ScryptError>((resume) => {
				try {
					scrypt(password, salt, keylen, options, (error, derivedKey) => {
						if (error) {
							resume(Effect.fail(new ScryptError({ error })));
						} else {
							resume(Effect.succeed(derivedKey));
						}
					});
				} catch (error) {
					resume(Effect.fail(new ScryptError({ error })));
				}
			})
		);
	}),
}) {
	/**
	 * This is used to create a configuration layer for the Scrypt service.
	 */
	static makeConfig = (opts: ScryptConfigOptions) => ScryptConfig.Make(opts);

	/**
	 * Creates a live instance of the Scrypt service with the specified configuration options.
	 *
	 * @param opts - The configuration options for the Scrypt service.
	 * @returns Layer that provides the Scrypt service with the specified configuration.
	 */
	static makeLive = (opts: ScryptConfigOptions) =>
		Layer.provide(this.Default, this.makeConfig(opts));
}
