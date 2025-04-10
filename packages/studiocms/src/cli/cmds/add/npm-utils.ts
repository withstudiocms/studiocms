import { detect } from 'package-manager-detector';
import maxSatisfying from 'semver/ranges/max-satisfying.js';
import { exec } from '../../lib/exec.js';
import type { PluginInfo } from './utils.js';

// Users might lack access to the global npm registry, this function
// checks the user's project type and will return the proper npm registry
//
// A copy of this function also exists in the create-astro package
let _registry: string;
export async function getRegistry(): Promise<string> {
	if (_registry) return _registry;
	const fallback = 'https://registry.npmjs.org';
	const packageManager = (await detect())?.name || 'npm';
	try {
		const { stdout } = await exec(packageManager, ['config', 'get', 'registry']);
		_registry = stdout.trim()?.replace(/\/$/, '') || fallback;
		// Detect cases where the shell command returned a non-URL (e.g. a warning)
		if (!new URL(_registry).host) _registry = fallback;
	} catch {
		_registry = fallback;
	}
	return _registry;
}

export async function fetchPackageVersions(packageName: string): Promise<string[] | Error> {
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}`, {
		headers: { accept: 'application/vnd.npm.install-v1+json' },
	});
	if (res.status >= 200 && res.status < 300) {
		return await res.json().then((data) => Object.keys(data.versions));
	}
	if (res.status === 404) {
		// 404 means the package doesn't exist, so we don't need an error message here
		return new Error();
	}
	return new Error(`Failed to fetch ${registry}/${packageName} - GET ${res.status}`);
}

/**
 * Resolves package with a given range to a STABLE version
 * peerDependencies might specify a compatible prerelease,
 * but `astro add` should only ever install stable releases
 */
export async function resolveRangeToInstallSpecifier(name: string, range: string): Promise<string> {
	const versions = await fetchPackageVersions(name);
	if (versions instanceof Error) return name;
	// Filter out any prerelease versions, but fallback if there are no stable versions
	const stableVersions = versions.filter((v) => !v.includes('-'));
	const maxStable = maxSatisfying(stableVersions, range) ?? maxSatisfying(versions, range);
	if (!maxStable) return name;
	return `${name}@^${maxStable}`;
}

export async function fetchPackageJson(
	scope: string | undefined,
	name: string,
	tag: string
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
): Promise<Record<string, any> | Error> {
	const packageName = `${scope ? `${scope}/` : ''}${name}`;
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}/${tag}`);
	if (res.status >= 200 && res.status < 300) {
		return await res.json();
	}
	if (res.status === 404) {
		// 404 means the package doesn't exist, so we don't need an error message here
		return new Error();
	}
	return new Error(`Failed to fetch ${registry}/${packageName}/${tag} - GET ${res.status}`);
}

export async function convertIntegrationsToInstallSpecifiers(
	plugins: PluginInfo[]
): Promise<string[]> {
	const ranges: Record<string, string> = {};
	for (const { dependencies } of plugins) {
		for (const [name, range] of dependencies) {
			ranges[name] = range;
		}
	}
	return Promise.all(
		Object.entries(ranges).map(([name, range]) => resolveRangeToInstallSpecifier(name, range))
	);
}

export function parseNpmName(
	spec: string
): { scope?: string; name: string; subpath?: string } | undefined {
	// not an npm package
	if (!spec || spec[0] === '.' || spec[0] === '/') return undefined;

	let scope: string | undefined;
	let name = '';

	const parts = spec.split('/');
	if (parts[0][0] === '@') {
		scope = parts[0];
		name = `${parts.shift()}/`;
	}
	name += parts.shift();

	const subpath = parts.length ? `./${parts.join('/')}` : undefined;

	return {
		scope,
		name,
		subpath,
	};
}

export function parsePluginName(spec: string) {
	// Parses a string like "@scope/name@tag" into { scope: "@scope", name: "name", tag: "tag" }
	// If no tag is provided, defaults to "latest"
	const result = parseNpmName(spec);
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
}
