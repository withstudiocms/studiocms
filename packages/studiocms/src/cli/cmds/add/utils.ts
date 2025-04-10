import fsMod from 'node:fs';
import type * as p from '@clack/prompts';
import color from 'chalk';

export type ClackPrompts = typeof p;

export const ALIASES = new Map([
	['blog', '@studiocms/blog'],
	['mdx', '@studiocms/mdx'],
	['markdoc', '@studiocms/markdoc'],
]);

export const StudioCMSScopes = ['@studiocms', '@withstudiocms'];

export interface PluginInfo {
	id: string;
	packageName: string;
	pluginName: string;
	dependencies: [name: string, version: string][];
}

export interface Logger {
	log: (message: string) => void;
	debug: (message: string) => void;
	error: (message: string) => void;
	warn: (message: string) => void;
}

// biome-ignore lint/style/useEnumInitializers: <explanation>
// biome-ignore lint/suspicious/noConstEnum: <explanation>
export const enum UpdateResult {
	none,
	updated,
	cancelled,
	failure,
}

export const STUBS = {
	STUDIOCMS_CONFIG: `import { defineStudioCMSConfig } from 'studiocms/config';\n\nexport default defineStudioCMSConfig({\n\tdbStartPage: false,\n});`,
};

export const toIdent = (name: string) => {
	const ident = name
		.trim()
		// Remove astro or (astrojs) prefix and suffix
		.replace(/[-_./]?studiocms?[-_.]?/g, '')
		// drop .js suffix
		.replace(/\.js/, '')
		// convert to camel case
		.replace(/[.\-_/]+([a-zA-Z])/g, (_, w) => w.toUpperCase())
		// drop invalid first characters
		.replace(/^[^a-zA-Z$_]+/, '')
		// drop version or tag
		.replace(/@.*$/, '');
	return `${ident[0].toLowerCase()}${ident.slice(1)}`;
};

export function createPrettyError(err: Error) {
	err.message = `StudioCMS could not update your studiocms.config.mjs file safely.
	Reason: ${err.message}
	
	You will need to add these plugins(s) manually.
	Documentation: https://docs.studiocms.dev`;
	return err;
}

export function cancelled(message: string, tip?: string) {
	const badge = color.bgYellow(color.black(' cancelled '));
	const headline = color.yellow(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

export function success(message: string, tip?: string) {
	const badge = color.bgGreen(color.black(' success '));
	const headline = color.green(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

/**
 * Paths to search for the StudioCMS config file,
 * sorted by how likely they're to appear.
 */
const configPaths = Object.freeze([
	'./studiocms.config.js',
	'./studiocms.config.mjs',
	'./studiocms.config.cjs',
	'./studiocms.config.ts',
	'./studiocms.config.mts',
	'./studiocms.config.cts',
]);

export async function resolveConfigPath(root: URL): Promise<URL | undefined> {
	for (const path of configPaths) {
		const configUrl = new URL(path, root);
		if (exists(configUrl)) return configUrl;
	}
	return undefined;
}

export function exists(path: URL | string | undefined) {
	if (!path) return false;
	try {
		fsMod.statSync(path);
		return true;
	} catch {
		return false;
	}
}

const isWindows = process?.platform === 'win32';

function slash(path: string) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

export function pathToFileURL(path: string): URL {
	if (isWindows) {
		let slashed = slash(path);
		// Windows like C:/foo/bar
		if (!slashed.startsWith('/')) {
			slashed = `/${slashed}`;
		}
		return new URL(`file://${slashed}`);
	}

	// Unix is easy
	return new URL(`file://${path}`);
}

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : `${path}/`;
}
