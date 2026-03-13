import type { AstroIntegration, BaseIntegrationHooks, HookParameters } from 'astro';
import { Data, Effect, Schema } from 'effect';

/**
 * Defines a type for errors that can occur during the setup of an Astro integration, including invalid options and errors in any of the integration hooks.
 */
export type EffectifyIntegrationErrorOptions = 'integration:options' | keyof BaseIntegrationHooks;

/**
 * A custom error class for handling errors related to the setup and execution of Astro integrations defined using the `defineIntegration` function. This error can capture issues such as invalid options provided to the integration or errors that occur within any of the integration hooks.
 */
export class EffectifyIntegrationHookError extends Data.TaggedError('IntegrationHookError')<{
	hook: EffectifyIntegrationErrorOptions;
	message: string;
	cause?: unknown;
}> {}

/**
 * Defines a type for the hooks of an Astro integration, where each hook is represented as an Effect that can potentially fail with an `EffectifyIntegrationHookError`. The keys of this type correspond to the hooks defined in `BaseIntegrationHooks`, and the values are functions that take the parameters of the respective hook and return an Effect that represents the execution of that hook.
 */
export type EffectifyAstroIntegrationHooks = {
	[K in keyof BaseIntegrationHooks]?: (
		options: HookParameters<K>
	) => Effect.Effect<void, EffectifyIntegrationHookError, never>;
};

/**
 * A utility function for defining an Astro integration using the Effect library. This function takes an object with a name, an optional schema for validating the integration options, and a setup function that returns the hooks for the integration as Effects. The returned function can be used to create an Astro integration by providing the necessary options, which will be validated against the schema if provided. If the options are valid, the hooks will be set up and returned in a format compatible with Astro's integration system.
 *
 * @param name The name of the integration.
 * @param schema An optional schema for validating the integration options.
 * @param setup A function that takes the integration name and validated options, and returns the hooks for the integration as Effects.
 * @returns A function that can be used to create an Astro integration by providing the necessary options.
 */
export const defineIntegration =
	<A, I>({
		name,
		schema,
		setup,
	}: {
		name: string;
		schema?: Schema.Schema<A, I>;
		setup: (params: { name: string; options: A }) => EffectifyAstroIntegrationHooks;
	}): ((options?: I) => AstroIntegration) =>
	(options) => {
		let finalOptions: A | undefined;

		if (schema) {
			const decoder = Schema.decodeUnknownEither(schema);
			const decodedOptions = decoder(options ?? ({} as unknown));
			if (decodedOptions._tag === 'Right') {
				finalOptions = decodedOptions.right;
			} else {
				throw new EffectifyIntegrationHookError({
					hook: 'integration:options',
					message: `Invalid options provided for integration "${name}": ${JSON.stringify(decodedOptions.left)}`,
				});
			}
		}

		const effectHooks = setup({ name, options: finalOptions as A });

		return {
			name,
			hooks: Object.entries(effectHooks).reduce(
				(acc, [hookName, hookEffect]) => {
					acc[hookName as keyof BaseIntegrationHooks] = async (params) =>
						// biome-ignore lint/suspicious/noExplicitAny: Astro's hook parameters are complex and vary widely, so we use `any` here for simplicity.
						Effect.runPromise(hookEffect(params as any));
					return acc;
				},
				{} as AstroIntegration['hooks']
			),
		};
	};
