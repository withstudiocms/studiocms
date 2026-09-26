import { Effect, Schema } from 'effect';
import { defineIntegration, EffectifyIntegrationHookError } from '../../src/astro/integration';

/**
 * Example of a Effect to run within the hooks of an Astro integration, demonstrating how to create a custom log message that includes the integration name and options. This Effect can be used within any of the integration hooks to provide informative logging about the setup and configuration of the integration. If the options are invalid or if any error occurs during the creation of the log message, it will be captured and can be handled appropriately within the integration hooks.
 */
const makeCustomLogMessage = (name: string, options: unknown) =>
	Effect.try(() => {
		const optionsString = JSON.stringify(options);
		return `Integration "${name}" has been set up with options: ${optionsString}`;
	});

// Example of defining an Astro integration using the `defineIntegration` utility function
export const MyIntegration = defineIntegration({
	name: 'MyIntegration',
	schema: Schema.Struct({
		foo: Schema.optionalWith(Schema.String, {
			default: () => 'bar',
		}),
	}),
	setup: ({ name, options }) => ({
		'astro:config:setup': Effect.fn(
			function* ({ logger }) {
				const logMessage = yield* makeCustomLogMessage(name, options);
				logger.info(logMessage);
			},
			Effect.catchAll(
				(error) =>
					new EffectifyIntegrationHookError({
						hook: 'astro:config:setup',
						message: 'Unknown Error occurred',
						cause: error,
					})
			)
		),
	}),
});
