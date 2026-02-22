import dns from 'node:dns/promises';
import { styleText } from 'node:util';
import { verifyTemplate } from '@bluwy/giget-core';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { confirm, log } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { compare as semCompare } from 'semver';
import pkg from '../../package.json';
import { CLIError, type Context, type EffectStepFn } from '../context.ts';
import { getTemplateTarget } from './template.ts';

const name = pkg.name;
const version = pkg.version;

/**
 * Verify internet connection and template availability
 */
export const verify: EffectStepFn = Effect.fn('verify')(
	function* (ctx: Context) {
		if (!ctx.dryRun) {
			if (ctx.debug) yield* Effect.log('Checking internet connection...');
			const online = yield* isOnline();
			if (!online) {
				yield* log.error(StudioCMSColorwayError('Error: Unable to connect to the internet.'));
				ctx.exit(1);
			}
			if (ctx.debug) yield* Effect.log('Internet connection verified');

			// Check if we are on the latest version of the CLI
			if (ctx.debug) yield* Effect.log('Checking for updates...');

			const latestVersion = yield* getLatestVersionEffect().pipe(Effect.orElseSucceed(() => null));

			if (latestVersion) {
				const comparison = semCompare(version, latestVersion);
				switch (comparison) {
					case -1: {
						const updateConfirmed = yield* confirm({
							message: StudioCMSColorwayInfo(
								`${styleText('bold', 'A new version of the CLI is available!')} You are using version ${styleText('reset', version)} but the latest version is ${styleText('reset', latestVersion)}. It is recommended to restart the CLI with the latest version to get new features and bug fixes!\n\nDo you want to exit?`
							),
							initialValue: true,
						});

						if (updateConfirmed !== false) {
							yield* log.info(
								StudioCMSColorwayInfo(
									'Check https://www.npmjs.com/package/create-studiocms for the latest version.'
								)
							);
							ctx.exit(0);
						}
						break;
					}
					default:
						if (ctx.debug) yield* Effect.log('You are using the latest version of the CLI');
						break;
				}
			}
		}

		if (ctx.template) {
			if (ctx.debug) yield* Effect.log('Verifying template...');
			const target = getTemplateTarget(ctx.template, ctx.templateRegistry, ctx.templateRef);
			const ok = yield* Effect.tryPromise({
				try: () => verifyTemplate(target),
				catch: (cause) => new CLIError({ cause }),
			});
			if (!ok) {
				yield* log.error(
					StudioCMSColorwayError(
						`Error: Template ${styleText('reset', ctx.template)} ${styleText('dim', 'could not be found!')}`
					)
				);
				yield* log.info(
					StudioCMSColorwayInfo(
						`Check ${ctx.templateRegistry.currentRepositoryUrl} for available templates.`
					)
				);
				ctx.exit(1);
			}
			if (ctx.debug) yield* Effect.log('Template verified');
		}
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);

/**
 * Check if we are online by resolving github.com
 */
const isOnline = Effect.fn('isOnline')(() =>
	Effect.tryPromise({
		try: () =>
			dns.lookup('github.com').then(
				() => true,
				() => false
			),
		catch: (cause) => new CLIError({ cause }),
	})
);

/**
 * Get the latest version of the CLI from npm registry
 */
const getLatestVersionEffect = Effect.fn('getLatestVersion')(() =>
	Effect.tryPromise({
		try: () =>
			fetch(`https://registry.npmjs.org/${name}/latest`, {
				signal: AbortSignal.timeout(5000),
			})
				.then((res) => {
					if (!res.ok) return null;
					return res.json() as Promise<{ version?: string }>;
				})
				.then((data) => data?.version ?? null),
		catch: (cause) => new CLIError({ cause }),
	})
);
