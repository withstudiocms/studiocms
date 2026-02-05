import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';
import { downloadTemplate } from '@bluwy/giget-core';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { log, select } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { CLIError, type Context, type EffectStepFn } from '../context.ts';

/**
 * Get the full template target URL for giget
 */
export function getTemplateTarget(
	_template: string,
	templateRegistry: Context['templateRegistry'],
	ref = 'latest'
) {
	const isThirdParty = _template.includes('/');
	if (isThirdParty) return _template;

	// Handle StudioCMS templates
	if (ref === 'latest') {
		return `${templateRegistry.gigetRepoUrl}#templates/${_template}`;
	}
	return `${templateRegistry.gigetRepoUrl}/templates/${_template}#${ref}`;
}

/**
 * Template selection step
 */
export const template: EffectStepFn = Effect.fn('template')(
	function* (ctx: Context) {
		if (ctx.debug) yield* Effect.logDebug('Running template...');
		if (!ctx.template && ctx.yes) ctx.template = ctx.templateRegistry.defaultTemplate;

		if (ctx.template) {
			yield* log.info(
				`Using ${styleText('reset', ctx.template)}${styleText('dim', ' as project template')}`
			);
			ctx.isStudioCMSProject = true;
		} else {
			const _template = yield* select({
				message: 'How would you like to start your new StudioCMS project?',
				options: ctx.templateRegistry.currentTemplates,
			});

			if (typeof _template === 'symbol') {
				yield* log.error('Input cancelled by user.');
				ctx.exit(1);
			} else {
				if (ctx.debug) yield* Effect.logDebug(`Template selected: ${_template}`);

				ctx.template = _template;
				ctx.isStudioCMSProject = true;
			}
		}

		if (ctx.dryRun) {
			yield* log.info(
				`${StudioCMSColorwayInfo('--dry-run')} ${styleText('dim', 'Skipping template copying')}`
			);
		} else if (ctx.template) {
			ctx.tasks.push({
				title: 'Template',
				// @effect-diagnostics-next-line runEffectInsideEffect:off
				task: async (message) =>
					Effect.runPromise(
						Effect.gen(function* () {
							message('Template copying...');
							// biome-ignore lint/style/noNonNullAssertion: This is fine
							yield* copyTemplate(ctx.template!, ctx);
							message('Template complete');
						}).pipe(
							Effect.catchAll(
								Effect.fn(function* (err) {
									yield* log.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
									process.exit(1);
								})
							)
						)
					),
			});
		} else {
			ctx.exit(1);
		}

		if (ctx.debug) yield* Effect.logDebug('Template complete');
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);

/**
 * Post-process Files to remove after template copying
 */
const FILES_TO_REMOVE = ['CHANGELOG.md', '.codesandbox'];

/**
 * Post-process Files to update after template copying
 */
const FILES_TO_UPDATE = {
	'package.json': (file: string, overrides: { name: string }) =>
		fs.promises.readFile(file, 'utf-8').then((value) => {
			// Match first indent in the file or fallback to `\t`
			const indent = /(^\s+)/m.exec(value)?.[1] ?? '\t';
			return fs.promises.writeFile(
				file,
				JSON.stringify(
					Object.assign(JSON.parse(value), Object.assign(overrides, { private: undefined })),
					null,
					indent
				),
				'utf-8'
			);
		}),
};

/**
 * Copy template to target directory and post-process
 */
const copyTemplate = Effect.fn('copyTemplate')(
	function* (_template: string, ctx: Context) {
		const templateTarget = getTemplateTarget(_template, ctx.templateRegistry, ctx.templateRef);

		if (ctx.dryRun) {
			yield* log.info(
				`${StudioCMSColorwayInfo('--dry-run')} ${styleText('dim', 'Skipping template copying')}`
			);

			return;
		}

		yield* Effect.tryPromise({
			try: () =>
				downloadTemplate(templateTarget, {
					force: true,
					cwd: ctx.cwd,
					dir: '.',
				}),
			catch: (cause) => new CLIError({ cause }),
		}).pipe(
			Effect.catchTag(
				'CLIError',
				Effect.fn(function* (err) {
					// Only remove the directory if it's most likely created by us.
					if (ctx.cwd !== '.' && ctx.cwd !== './' && !ctx.cwd.startsWith('../')) {
						yield* Effect.try({
							try: () => fs.rmdirSync(ctx.cwd),
							catch: (cause) => new CLIError({ cause }),
						}).pipe(Effect.catchTag('CLIError', Effect.logError));
					}
					yield* log
						.error(StudioCMSColorwayError(`Error: ${err.toString()}`))
						.pipe(Effect.catchAll(Effect.logError));
					return yield* err;
				})
			)
		);

		// Post-process in parallel
		const removeFiles = FILES_TO_REMOVE.map((file) => {
			const fileLoc = path.resolve(path.join(ctx.cwd, file));
			return Effect.tryPromise({
				try: async () => {
					if (fs.existsSync(fileLoc)) {
						return fs.promises.rm(fileLoc, { recursive: true });
					}
				},
				catch: (cause) => new CLIError({ cause }),
			});
		});

		const updateFiles = Object.entries(FILES_TO_UPDATE).map(([file, update]) => {
			const fileLoc = path.resolve(path.join(ctx.cwd, file));
			return Effect.tryPromise({
				try: async () => {
					if (fs.existsSync(fileLoc)) {
						// biome-ignore lint/style/noNonNullAssertion: This is fine
						return update(fileLoc, { name: ctx.projectName! });
					}
				},
				catch: (cause) => new CLIError({ cause }),
			});
		});

		yield* Effect.all([...removeFiles, ...updateFiles]);
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);
