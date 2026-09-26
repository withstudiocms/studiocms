import { exec } from '@withstudiocms/cli-kit/utils';
import { detect as _detect } from 'package-manager-detector';
import maxSatisfying from 'semver/ranges/max-satisfying.js';
import { Effect, genLogger } from '../../effect.js';
import type { PluginInfo } from './index.js';

const eDetect = Effect.tryPromise(() => _detect());

const eExec = (command: string, args?: string[] | undefined) =>
	Effect.tryPromise(() => exec(command, args));

// Users might lack access to the global npm registry, this function
// checks the user's project type and will return the proper npm registry
//
// This function is adapted from similar utilities in other projects
let _registry: string;
export const getRegistry = genLogger('studiocms/cli/add/npm-utils.getRegistry')(function* () {
	if (_registry) return _registry;

	const fallback = 'https://registry.npmjs.org';
	const packageManager = (yield* eDetect)?.name || 'npm';

	try {
		const { stdout } = yield* eExec(packageManager, ['config', 'get', 'registry']);
		_registry = stdout.trim()?.replace(/\/$/, '') || fallback;

		try {
			const url = new URL(_registry);
			if (!url.host || !['http:', 'https:'].includes(url.protocol)) _registry = fallback;
		} catch {
			_registry = fallback;
		}
	} catch {
		_registry = fallback;
	}

	return _registry;
});

export const fetchPackageVersions = (packageName: string) =>
	genLogger('studiocms/cli/add/npm-utils.fetchPackageVersions')(function* () {
		const registry = yield* getRegistry;

		try {
			const res = yield* Effect.tryPromise(() =>
				fetch(`${registry}/${packageName}`, {
					headers: { accept: 'application/vnd.npm.install-v1+json' },
				})
			);
			if (res.status >= 200 && res.status < 300) {
				return yield* Effect.tryPromise(() =>
					res.json().then((data) => Object.keys(data.versions))
				);
			}
			if (res.status === 404) {
				// 404 means the package doesn't exist, so we don't need an error message here
				return new Error();
			}
			return new Error(`Failed to fetch ${registry}/${packageName} - GET ${res.status}`);
		} catch (error) {
			return new Error(
				`Network error while fetching ${registry}/${packageName}: ${(error as Error).message}`
			);
		}
	});

/**
 * Resolves package with a given range to a STABLE version
 * peerDependencies might specify a compatible prerelease,
 * but `studiocms add` should only ever install stable releases
 */
export const resolveRangeToInstallSpecifier = (name: string, range: string) =>
	genLogger('studiocms/cli/add/npm-utils.resolveRangeToInstallSpecifier')(function* () {
		const versions = yield* fetchPackageVersions(name);

		if (versions instanceof Error || !Array.isArray(versions)) return name;

		const stableVersions = versions.filter((v) => !v.includes('-'));

		const maxStable = maxSatisfying(stableVersions, range) ?? maxSatisfying(versions, range);

		if (!maxStable) return name;

		return `${name}@^${maxStable}`;
	});

export const convertPluginsToInstallSpecifiers = (plugins: PluginInfo[]) =>
	genLogger('studiocms/cli/add/npm-utils.convertPluginsToInstallSpecifiers')(function* () {
		const ranges: Record<string, string> = {};

		for (const { dependencies } of plugins) {
			for (const [name, range] of dependencies) {
				ranges[name] = range;
			}
		}

		return yield* Effect.all(
			Object.entries(ranges).map(([name, range]) => resolveRangeToInstallSpecifier(name, range))
		);
	});

export const fetchPackageJson = (scope: string | undefined, name: string, tag: string) =>
	genLogger('studiocms/cli/add/npm-utils.fetchPackageJson')(function* () {
		const packageName = `${scope ? `${scope}/` : ''}${name}`;

		const registry = yield* getRegistry;

		try {
			const res = yield* Effect.tryPromise(() => fetch(`${registry}/${packageName}/${tag}`));
			if (res.status >= 200 && res.status < 300) {
				return yield* Effect.tryPromise(() => res.json());
			}
			if (res.status === 404) {
				// 404 means the package doesn't exist, so we don't need an error message here
				return new Error();
			}
			return new Error(`Failed to fetch ${registry}/${packageName}/${tag} - GET ${res.status}`);
		} catch (error) {
			return new Error(
				`Network error while fetching ${registry}/${packageName}/${tag}: ${(error as Error).message}`
			);
		}
	});

export const parseNpmName = (spec: string) =>
	Effect.try(() => {
		// not an npm package
		if (!spec || spec[0] === '.' || spec[0] === '/') return undefined;

		let scope: string | undefined;
		let name = '';

		const parts = spec.split('/');
		if (parts[0][0] === '@') {
			scope = parts[0];
			parts.shift(); // Remove scope from parts
		}
		name = parts.shift() || '';

		const subpath = parts.length ? `./${parts.join('/')}` : undefined;

		return {
			scope,
			name,
			subpath,
		};
	});

export const parsePluginName = (spec: string) =>
	genLogger('studiocms/cli/add/npm-utils.parsePluginName')(function* () {
		const result = yield* parseNpmName(spec);
		if (!result) return;
		let { scope, name } = result;
		let tag = 'latest';
		if (scope) {
			name = name.replace(`${scope}/`, '');
		}
		if (name.includes('@')) {
			const tagged = name.split('@');
			name = tagged[0];
			tag = tagged[1];
		}
		// Basic validation to ensure we have a non-empty name
		if (!name) return undefined;
		return { scope, name, tag };
	});
