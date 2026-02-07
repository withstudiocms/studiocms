import type { Effect } from '../../effect.js';
import type { BaseContext } from './context.js';

/**
 * Represents a function that performs a step within a given context.
 *
 * @deprecated Use EffectStepFn instead for better effect handling.
 */
export type StepFn = (context: BaseContext, debug: boolean, dryRun?: boolean) => Promise<void>;

/**
 * Represents a function that performs an effectful step within a given context.
 *
 * @param context - The base context in which the effect is executed.
 * @param debug - Indicates whether debug mode is enabled.
 * @param dryRun - Optional flag to indicate if the step should be executed as a dry run (no side effects).
 * @returns An Effect that resolves to void or throws an Error.
 */
export type EffectStepFn = (
	context: BaseContext,
	debug: boolean,
	dryRun?: boolean
) => Effect.Effect<void, Error>;

/**
 * A mapping of step names to their corresponding effect step functions.
 *
 * @remarks
 * This type is used to associate a string key (typically the name or identifier of a step)
 * with an `EffectStepFn`, which represents the function to execute for that step.
 *
 * @see EffectStepFn
 */
export type StepMap = Record<string, EffectStepFn>;

/**
 * Appends effect step functions to the provided steps array based on the given options.
 *
 * Iterates over the `options` array, retrieves the corresponding step function from `stepMap`
 * for each option, and pushes it to the `steps` array if it exists.
 *
 * @param options - An array of option strings used to look up step functions.
 * @param steps - The array of `EffectStepFn` to which matched step functions will be appended.
 * @param stepMap - A mapping of option strings to their corresponding `EffectStepFn`.
 */
export function appendOptionsToSteps(options: string[], steps: EffectStepFn[], stepMap: StepMap) {
	return options.forEach((opt) => {
		const step = stepMap[opt];
		if (step) {
			steps.push(step);
		}
	});
}
