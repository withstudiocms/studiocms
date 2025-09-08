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
