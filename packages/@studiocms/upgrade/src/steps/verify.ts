import dns from 'node:dns/promises';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { styleText } from 'node:util';
import { log, note } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import semverCoerce from 'semver/functions/coerce.js';
import semverDiff from 'semver/functions/diff.js';
import semverParse from 'semver/functions/parse.js';
import { CLIError, type Context, type EffectStepFn, type PackageInfo } from '../context.ts';
import { getRegistry } from '../npm-utils.ts';

/**
 * Effect to verify the StudioCMS project and package versions.
 *
 * @param context - The context containing version and packages information.
 *
 * @returns An Effect that performs verification and may exit the process on failure.
 */
export const verify: EffectStepFn = Effect.fn('verify')(
	function* (context: Context) {
		const registry = yield* getRegistry;

		if (!context.dryRun) {
			const online = yield* isOnline(registry);
			if (!online) {
				yield* log.error('Unable to connect to the internet.');
				return context.exit(1);
			}
		}

		const isStudioCMSProject = yield* verifyStudioCMSProject(context);
		if (!isStudioCMSProject) {
			yield* log.error('StudioCMS installation not found in the current directory.');
			return context.exit(1);
		}

		const ok = yield* verifyVersions(context, registry);
		if (!ok) {
			yield* log.error(
				`Version ${styleText('reset', context.version)} ${styleText('dim', 'could not be found!')}`
			);
			yield* note('https://github.com/withstudiocms/studiocms/releases', 'check');
			return context.exit(1);
		}

		return;
	},
	Effect.catchTag('ClackError', (error) =>
		Effect.fail(new CLIError({ cause: `Verification failed: ${String(error.cause)}` }))
	)
);

/**
 * Effect to check if the system is online by resolving the npm registry hostname.
 *
 * @param registry - The npm registry URL to check connectivity against.
 *
 * @returns An Effect that resolves to `true` if online, `false` otherwise.
 */
const isOnline = Effect.fn('isOnline')(function* (registry: string) {
	const result = yield* Effect.tryPromise(() => {
		const { hostname } = new URL(registry);
		return dns.lookup(hostname).then(
			() => true,
			() => false
		);
	}).pipe(
		Effect.catchAll(
			Effect.fn(function* (error) {
				yield* Effect.logError(`Error checking online status: ${String(error)}`);
				return yield* Effect.succeed(false);
			})
		)
	);
	return result;
});

/**
 * Safely parses a JSON string and returns the resulting object.
 * If parsing fails, returns an empty object.
 *
 * @param value - The JSON string to parse.
 * @returns The parsed object or an empty object if parsing fails.
 */
function safeJSONParse(value: string) {
	try {
		return JSON.parse(value);
	} catch {}
	return {};
}

/**
 * Determines if a package is a StudioCMS package based on its name.
 *
 * @param name - The name of the package.
 * @param _version - The version of the package (not used in this function).
 *
 * @returns `true` if the package is a StudioCMS package, `false` otherwise.
 */
function isStudioCMSPackage(name: string, _version: string) {
	return (
		name === 'studiocms' ||
		name.startsWith('@studiocms/') ||
		name === 'astro' ||
		name.startsWith('@astrojs/')
	);
}

/**
 * Determines if a package is allowed for upgrade based on its name.
 *
 * @param name - The name of the package.
 * @param _version - The version of the package (not used in this function).
 *
 * @returns `true` if the package is allowed for upgrade, `false` otherwise.
 */
function isAllowedPackage(name: string, _version: string) {
	return name !== '@studiocms/upgrade';
}

/**
 * Determines if the provided version string is a valid semver version.
 *
 * @param _name - The name of the package (not used in this function).
 * @param version - The version string to validate.
 *
 * @returns `true` if the version is valid, `false` otherwise.
 */
function isValidVersion(_name: string, version: string) {
	return semverCoerce(version, { loose: true }) !== null;
}

/**
 * Determines if a package is supported for upgrade based on its name and version.
 *
 * @param name - The name of the package.
 * @param version - The current version of the package.
 *
 * @returns `true` if the package is supported for upgrade, `false` otherwise.
 */
function isSupportedPackage(name: string, version: string): boolean {
	for (const validator of [isStudioCMSPackage, isAllowedPackage, isValidVersion]) {
		if (!validator(name, version)) return false;
	}
	return true;
}

/**
 * Collects package information from the provided dependencies and devDependencies,
 * and populates the context's packages array with relevant package info.
 *
 * @param ctx - The context object containing version and packages array.
 * @param dependencies - An object representing the dependencies from package.json.
 * @param devDependencies - An object representing the devDependencies from package.json.
 */
export function collectPackageInfo(
	ctx: Pick<Context, 'version' | 'packages'>,
	dependencies: Record<string, string> = {},
	devDependencies: Record<string, string> = {}
) {
	for (const [name, currentVersion] of Object.entries(dependencies)) {
		if (!isSupportedPackage(name, currentVersion)) continue;
		ctx.packages.push({
			name,
			currentVersion,
			targetVersion: ctx.version,
		});
	}
	for (const [name, currentVersion] of Object.entries(devDependencies)) {
		if (!isSupportedPackage(name, currentVersion)) continue;
		ctx.packages.push({
			name,
			currentVersion,
			targetVersion: ctx.version,
			isDevDependency: true,
		});
	}
}

/**
 * Effect to verify if the current project is a StudioCMS project.
 *
 * @param context - The context containing the current working directory.
 *
 * @returns An Effect that resolves to `true` if it's a StudioCMS project, `false` otherwise.
 */
const verifyStudioCMSProject = Effect.fn('verifyStudioCMSProject')(function* (context: Context) {
	const packageJson = new URL('./package.json', context.cwd);

	if (!existsSync(packageJson)) {
		return false;
	}

	const contents = yield* Effect.tryPromise({
		try: () => readFile(packageJson, { encoding: 'utf-8' }),
		catch: (error) => new CLIError({ cause: `Failed to read package.json: ${String(error)}` }),
	}).pipe(
		Effect.catchTag('CLIError', Effect.logError),
		Effect.map((data) => data || '')
	);

	const { dependencies = {}, devDependencies = {} } = safeJSONParse(contents);

	if (!contents.includes('studiocms')) {
		return false;
	}

	if (dependencies.studiocms === undefined && devDependencies.studiocms === undefined) {
		return false;
	}

	// Side-effect! Persist dependency info to the shared context
	collectPackageInfo(context, dependencies, devDependencies);

	return true;
});

/**
 * Effect to verify and resolve target versions for all packages in the context.
 *
 * @param ctx - The context containing version and packages information.
 * @param registry - The npm registry URL to fetch package metadata from.
 *
 * @returns An Effect that resolves to `true` if all packages have valid target versions, `false` otherwise.
 */
const verifyVersions = Effect.fn('verifyVersions')(function* (
	ctx: Pick<Context, 'version' | 'packages' | 'exit'>,
	registry: string
) {
	// Tasks to resolve target versions
	const tasks: Effect.Effect<void, CLIError, never>[] = [];

	// For each package, resolve the target version
	for (const packageInfo of ctx.packages) {
		tasks.push(resolveTargetVersion(packageInfo, registry));
	}

	// Execute all tasks in parallel
	yield* Effect.all(tasks);

	// Check if all packages have a valid target version
	for (const packageInfo of ctx.packages) {
		if (!packageInfo.targetVersion) {
			return false;
		}
	}

	// All packages have valid target versions
	return true;
});

/**
 * Effect to resolve the target version for a given package.
 *
 * @param packageInfo - The package information including name and current version.
 * @param registry - The npm registry URL to fetch package metadata from.
 */
const resolveTargetVersion = Effect.fn('resolveTargetVersion')(function* (
	packageInfo: PackageInfo,
	registry: string
) {
	// Fetch package metadata from the registry
	const packageMetadata = yield* Effect.tryPromise({
		try: () =>
			fetch(`${registry}/${packageInfo.name}`, {
				headers: { accept: 'application/vnd.npm.install-v1+json' },
			}),
		catch: (cause) => new CLIError({ cause }),
	});

	// Check for HTTP errors
	if (packageMetadata.status >= 400) {
		throw new Error(`Unable to resolve "${packageInfo.name}"`);
	}

	// Parse the JSON response
	const { 'dist-tags': distTags } = yield* Effect.tryPromise({
		try: () => packageMetadata.json(),
		catch: (cause) => new CLIError({ cause }),
	});

	// Determine the target version based on dist-tags
	let version = distTags[packageInfo.targetVersion];

	// If a specific version is provided, use it; otherwise, default to 'latest'
	if (version) {
		packageInfo.tag = packageInfo.targetVersion;
		packageInfo.targetVersion = version;
	} else {
		packageInfo.targetVersion = 'latest';
		version = distTags.latest;
	}

	// If the current version matches the target version, no update is needed
	if (packageInfo.currentVersion === version) {
		return;
	}

	// Determine if the update is a major version bump
	const prefix = packageInfo.targetVersion === 'latest' ? '^' : '';

	// Set the target version with the appropriate prefix
	packageInfo.targetVersion = `${prefix}${version}`;

	// biome-ignore lint/style/noNonNullAssertion: we know this is valid from isValidVersion check
	const fromVersion = semverCoerce(packageInfo.currentVersion)!;
	// biome-ignore lint/style/noNonNullAssertion: we know this is valid from isValidVersion check
	const toVersion = semverParse(version)!;
	const bump = semverDiff(fromVersion, toVersion);

	// If it's a major or premajor bump, attempt to set changelog URL
	if ((bump === 'major' && toVersion.prerelease.length === 0) || bump === 'premajor') {
		packageInfo.isMajor = true;
		if (packageInfo.name === 'studiocms') {
			// TODO: Setup proper upgrade guide URLs per major version
			// const upgradeGuide = `https://docs.studiocms.dev/en/guides/upgrade-to/v${toVersion.major}/`;
			const upgradeGuide = 'https://docs.studiocms.dev';
			const docsRes = yield* Effect.tryPromise({
				try: () => fetch(upgradeGuide),
				catch: (cause) => new CLIError({ cause }),
			});
			// OK if this request fails, it's probably a prerelease without a public migration guide.
			// In that case, we should fallback to the CHANGELOG check below.
			if (docsRes.status === 200) {
				packageInfo.changelogURL = upgradeGuide;
				packageInfo.changelogTitle = `Upgrade to StudioCMS v${toVersion.major}`;
				return;
			}
		}
		const latestMetadata = yield* Effect.tryPromise({
			try: () => fetch(`${registry}/${packageInfo.name}/latest`),
			catch: (cause) => new CLIError({ cause }),
		});
		if (latestMetadata.status >= 400) {
			throw new Error(`Unable to resolve "${packageInfo.name}"`);
		}
		const { repository } = yield* Effect.tryPromise({
			try: () => latestMetadata.json(),
			catch: (cause) => new CLIError({ cause }),
		});
		const branch = bump === 'premajor' ? 'next' : 'main';
		packageInfo.changelogURL = extractChangelogURLFromRepository(repository, version, branch);
		packageInfo.changelogTitle = 'CHANGELOG';
	} else {
		// Dependency updates should not include the specific dist-tag
		// since they are just for compatibility
		packageInfo.tag = undefined;
	}
});

/**
 * Extract the changelog URL from the repository information.
 *
 * @param repository - The repository information from the package metadata.
 * @param version - The target version for which to extract the changelog URL.
 * @param branch - The branch name where the changelog is located (default is 'main').
 *
 * @returns The constructed changelog URL.
 */
function extractChangelogURLFromRepository(
	repository: Record<string, string>,
	version: string,
	branch = 'main'
) {
	return `${repository.url.replace('git+', '').replace('.git', '')}/blob/${branch}/${repository.directory}/CHANGELOG.md#${version.replace(/\./g, '')}`;
}
