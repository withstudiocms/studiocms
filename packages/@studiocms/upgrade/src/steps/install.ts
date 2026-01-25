import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { label, random, sleep } from '@withstudiocms/cli-kit/messages';
import { shell } from '@withstudiocms/cli-kit/utils';
import { confirm, isCancel, log, note } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { resolveCommand } from 'package-manager-detector';
import terminalLink from 'terminal-link';
import { CLIError, type Context, type EffectStepFn, type PackageInfo } from '../context.ts';
import { celebrations, done } from '../messages.ts';

/**
 * Step to install the upgraded packages.
 *
 * @param context - The upgrade context containing package information and settings.
 * @returns An Effect that performs the installation step.
 */
export const install: EffectStepFn = Effect.fn('install')(
	function* (context) {
		yield* note(
			`\n${label('StudioCMS', (text: string) => styleText('bgGreen', text), 'black')}  ${styleText(
				'bold',
				'Package upgrade in progress.'
			)}`
		);

		// Filter packages into categories
		const { current, dependencies, devDependencies } = filterPackages(context);

		// Build installation list
		const toInstall = [...dependencies, ...devDependencies].sort(sortPackages);

		// Sort and log current packages
		for (const packageInfo of current.sort(sortPackages)) {
			const tag = /^\d/.test(packageInfo.targetVersion)
				? packageInfo.targetVersion
				: packageInfo.targetVersion.slice(1);
			yield* log.info(`${packageInfo.name} is up to date on v${tag}`);
			yield* Effect.tryPromise({
				try: () => sleep(random(50, 150)),
				catch: () =>
					new CLIError({ cause: `Failed during install logging for ${packageInfo.name}` }),
			}).pipe(Effect.catchAll((error) => Effect.logError(String(error))));
		}

		// If nothing to install, exit early
		if (toInstall.length === 0 && !context.dryRun) {
			yield* success(random(celebrations), random(done));
			return;
		}

		// Major upgrades tracking
		const majors: PackageInfo[] = [];

		// Loop through packages to setup installs or log dry run info
		for (const packageInfo of toInstall) {
			const word = context.dryRun ? 'can' : 'will';
			yield* upgrade(packageInfo, `${word} be updated`);
			if (packageInfo.isMajor) {
				majors.push(packageInfo);
			}
		}

		if (majors.length > 0) {
			const shouldProceed = yield* confirm({
				message: `${pluralize(
					['One package has', 'Some packages have'],
					majors.length
				)} breaking changes. Continue?`,
				initialValue: true,
			});

			if (isCancel(shouldProceed)) {
				return context.exit(0);
			}

			if (!shouldProceed) {
				return context.exit(0);
			}

			yield* log.warn(`Be sure to follow the ${pluralize('CHANGELOG', majors.length)}.`);
			for (const pkg of majors.sort(sortPackages)) {
				// biome-ignore lint/style/noNonNullAssertion: changelogTitle and changelogURL are set during package analysis
				yield* changelog(pkg.name, pkg.changelogTitle!, pkg.changelogURL!);
			}
		}

		if (context.dryRun) {
			yield* note('Skipping dependency installation', '--dry-run');
		} else {
			// Get current working directory
			const cwd = fileURLToPath(context.cwd);

			// Ensure yarn.lock exists for Yarn projects
			if (context.packageManager.name === 'yarn') {
				yield* ensureYarnLock({ cwd });
			}

			const installCommand = resolveCommand(context.packageManager.agent, 'add', []);

			if (!installCommand) {
				// NOTE: Usually it's impossible to reach here as `package-manager-detector` should
				// already match a supported agent
				yield* log.error(`Unable to find install command for ${context.packageManager.name}.`);
				return context.exit(1);
			}

			context.tasks.push({
				title: 'Install Dependencies',
				task: async (message) => {
					message(`Installing dependencies with ${context.packageManager.name}...`);

					try {
						if (dependencies.length > 0) {
							await shell(
								installCommand.command,
								[
									...installCommand.args,
									...dependencies.map(
										({ name, targetVersion }) => `${name}@${targetVersion.replace(/^\^/, '')}`
									),
								],
								{ cwd, timeout: 90_000, stdio: 'ignore' }
							);
						}
						if (devDependencies.length > 0) {
							await shell(
								installCommand.command,
								[
									...installCommand.args,
									...devDependencies.map(
										({ name, targetVersion }) => `${name}@${targetVersion.replace(/^\^/, '')}`
									),
								],
								{ cwd, timeout: 90_000, stdio: 'ignore' }
							);
						}
					} catch (_e) {
						const manualInstallCommand = [
							installCommand.command,
							...installCommand.args,
							...[...dependencies, ...devDependencies].map(
								({ name, targetVersion }) => `${name}@${targetVersion}`
							),
						].join(' ');
						// @effect-diagnostics-next-line runEffectInsideEffect:off
						await Effect.runPromise(
							log.error(
								`Dependencies failed to install, please run the following command manually:\n${styleText('bold', manualInstallCommand)}`
							)
						);
						return context.exit(1);
					}
				},
			});
		}
	},
	Effect.catchTag('ClackError', (error) =>
		Effect.fail(new CLIError({ cause: `Verification failed: ${String(error.cause)}` }))
	)
);

/**
 * Yarn Berry (PnP) versions will throw an error if there isn't an existing `yarn.lock` file
 * If a `yarn.lock` file doesn't exist, this function writes an empty `yarn.lock` one.
 * Unfortunately this hack is required to run `yarn install`.
 *
 * The empty `yarn.lock` file is immediately overwritten by the installation process.
 * See https://github.com/withastro/astro/pull/8028
 */
const ensureYarnLock = Effect.fn('ensureYarnLock')(function* ({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return yield* Effect.tryPromise({
		try: () => fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' }),
		catch: (cause) => new CLIError({ cause: `Failed to create empty yarn.lock: ${String(cause)}` }),
	});
});

/**
 * Pluralizes a word based on the provided count.
 *
 * @param word - The word to pluralize, or a tuple of [singular, plural].
 * @param n - The count to determine singular or plural form.
 * @returns The singular or plural form of the word based on the count.
 */
function pluralize(word: string | [string, string], n: number) {
	const [singular, plural] = Array.isArray(word) ? word : [word, `${word}s`];
	if (n === 1) return singular;
	return plural;
}

/**
 * Filters packages into current, dependencies, and devDependencies based on their versions.
 *
 * @param ctx - The context containing the packages to filter.
 * @returns An object containing arrays of current, dependencies, and devDependencies packages.
 */
function filterPackages(ctx: Pick<Context, 'packages'>) {
	const current: PackageInfo[] = [];
	const dependencies: PackageInfo[] = [];
	const devDependencies: PackageInfo[] = [];
	for (const packageInfo of ctx.packages) {
		const { currentVersion, targetVersion, isDevDependency } = packageInfo;
		// Remove prefix from version before comparing
		if (currentVersion.replace(/^\D+/, '') === targetVersion.replace(/^\D+/, '')) {
			current.push(packageInfo);
		} else {
			const arr = isDevDependency ? devDependencies : dependencies;
			arr.push(packageInfo);
		}
	}
	return { current, dependencies, devDependencies };
}

/**
 * An `Array#sort` comparator function to normalize how packages are displayed.
 * This only changes how the packages are displayed in the CLI, it is not persisted to `package.json`.
 */
function sortPackages(a: PackageInfo, b: PackageInfo): number {
	if (a.isMajor && !b.isMajor) return 1;
	if (b.isMajor && !a.isMajor) return -1;
	return a.name.localeCompare(b.name);
}

/**
 * Logs a success message with proper formatting based on terminal width.
 *
 * @param prefix - The prefix text to display.
 * @param text - The additional text to display.
 *
 * @returns An Effect that logs the success message.
 */
const success = Effect.fn('success')(function* (prefix: string, text: string) {
	const length = 10 + prefix.length + text.length;
	if (length > process.stdout.columns) {
		yield* log.success(`${styleText('green', '✔')}  ${prefix}`);
		yield* log.success(`${' '.repeat(4)}${styleText('dim', text)}`);
	} else {
		yield* log.success(`${styleText('green', '✔')}  ${prefix} ${styleText('dim', text)}`);
	}
});

/**
 * Logs an upgrade message with proper formatting based on terminal width.
 *
 * @param packageInfo - The package information object.
 * @param text - The additional text to display.
 *
 * @returns An Effect that logs the upgrade message.
 */
const upgrade = Effect.fn('upgrade')(function* (packageInfo: PackageInfo, text: string) {
	const { name, isMajor = false, targetVersion, currentVersion } = packageInfo;

	const bg = isMajor
		? (v: string) => styleText('bgYellow', styleText('black', ` ${v} `))
		: (v: string) => styleText('bgGreen', ` ${v} `);
	const style = isMajor ? styleText.bind(null, 'yellow') : styleText.bind(null, 'green');
	const symbol = isMajor ? '▲' : '●';

	const fromVersion = currentVersion.replace(/^\D+/, '');
	const toVersion = targetVersion.replace(/^\D+/, '');
	const version = `from v${fromVersion} to v${toVersion}`;

	const length = 12 + name.length + text.length + version.length;
	if (length > process.stdout.columns) {
		yield* log.info(`${style(symbol)}  ${name}`);
		yield* log.info(`${' '.repeat(4)}${styleText('dim', text)} ${bg(version)}`);
	} else {
		yield* log.info(`${style(symbol)}  ${name} ${styleText('dim', text)} ${bg(version)}`);
	}
});

/**
 * Logs a changelog link message with proper formatting based on terminal width.
 *
 * @param name - The package name.
 * @param text - The link text to display.
 * @param url - The URL of the changelog.
 *
 * @returns An Effect that logs the changelog link message.
 */
const changelog = Effect.fn('changelog')(function* (name: string, text: string, url: string) {
	const link = terminalLink(text, url, { fallback: () => url });
	const linkLength = terminalLink.isSupported ? text.length : url.length;
	const symbol = ' ';

	const length = 12 + name.length + linkLength;
	if (length > process.stdout.columns) {
		yield* log.info(`${symbol}  ${name}`);
		yield* log.info(`${' '.repeat(4)}${styleText('cyan', styleText('underline', link))}`);
	} else {
		yield* log.info(`${symbol}  ${name} ${styleText('cyan', styleText('underline', link))}`);
	}
});
