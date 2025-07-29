import * as prompts from '@clack/prompts';
import { detectPackageManager } from '@withstudiocms/cli-kit/context';
import { cancelMessage, getName } from '@withstudiocms/cli-kit/messages';
import chalk from 'chalk';
import { Context, Effect, genLogger, Layer } from '../../effect.js';

export interface BaseContext {
	prompts: typeof prompts;
	chalk: typeof chalk;
	cwd: string;
	packageManager: string;
	username: string;
	tasks: prompts.Task[];
	pCancel(val: symbol): void;
	pOnCancel(): void;
	exit(code: number): never;
}

export class CliContext extends Context.Tag('CliContext')<CliContext, BaseContext>() {
	static makeLayer = (context: BaseContext) => Layer.succeed(this, this.of(context));
	static makeProvide = (context: BaseContext) => Effect.provide(this.makeLayer(context));
}

export const genContext = genLogger('studiocms/cli/utils/context.genContext')(function* () {
	const packageManager = yield* Effect.orElse(
		Effect.try(() => {
			const manager = detectPackageManager();
			if (manager) return manager;
			throw new Error('Failed to detect package manager, falling back to npm');
		}),
		() => Effect.succeed('npm')
	);

	const cwd = process.cwd();

	const username = yield* Effect.tryPromise(() => getName());

	const context: BaseContext = {
		prompts,
		chalk,
		cwd,
		packageManager,
		username,
		tasks: [],
		pCancel(val: symbol) {
			if (prompts.isCancel(val)) {
				prompts.cancel(cancelMessage);
				process.exit(0);
			}
		},
		pOnCancel() {
			prompts.cancel(cancelMessage);
			process.exit(0);
		},
		exit(code) {
			process.exit(code);
		},
	};

	return context;
});
