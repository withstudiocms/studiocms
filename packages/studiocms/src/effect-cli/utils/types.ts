import type { BaseContext } from './context.js';

export type StepFn = (context: BaseContext, debug: boolean, dryRun?: boolean) => Promise<void>;
