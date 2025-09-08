import type { Effect } from '../../effect.js';
import type { BaseContext } from './context.js';

export type StepFn = (context: BaseContext, debug: boolean, dryRun?: boolean) => Promise<void>;

export type EffectStepFn = (
	context: BaseContext,
	debug: boolean,
	dryRun?: boolean
) => Effect.Effect<void, Error>;
