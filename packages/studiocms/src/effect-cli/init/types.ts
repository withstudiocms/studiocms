import type { BaseContext } from '../utils/context.js';

export type StepFn = (context: BaseContext, debug: boolean, dryRun: boolean) => Promise<void>;
