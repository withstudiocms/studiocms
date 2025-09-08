import { detectPackageManager } from '@withstudiocms/cli-kit/context';
import { cancelMessage, getName } from '@withstudiocms/cli-kit/messages';
import { type ClackError, cancel, isCancel, type Task } from '@withstudiocms/effect/clack';
import chalk from 'chalk';
import { Context, Effect, genLogger, Layer, type Option } from '../../effect.js';

export interface BaseContext {
	chalk: typeof chalk;
	cwd: string;
	packageManager: string;
	username: string;
	tasks: Task[];
	pCancel(val: symbol): Effect.Effect<void, ClackError, never>;
	pOnCancel(): Effect.Effect<void, ClackError, never>;
	exit(code: number): Effect.Effect<undefined, never, never>;
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

	const exit = (code: number) =>
		Effect.try(() => process.exit(code)).pipe(Effect.catchAll(() => Effect.succeed(void 0)));

	const context: BaseContext = {
		chalk,
		cwd,
		packageManager,
		username,
		tasks: [],
		pCancel: Effect.fn(function* (val: symbol) {
			const shouldCancel = yield* isCancel(val);
			if (shouldCancel) {
				yield* cancel(cancelMessage);
				return yield* exit(0);
			}
		}),
		pOnCancel: Effect.fn(function* () {
			yield* cancel(cancelMessage);
			return yield* exit(0);
		}),
		exit,
	};

	return context;
});

export const parseDebug = Effect.fn(function* (debugOpt: false | Option.Option<boolean>) {
	if (typeof debugOpt === 'boolean') {
		return debugOpt;
	}
	return yield* debugOpt;
});
