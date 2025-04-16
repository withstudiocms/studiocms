import type * as p from '@clack/prompts';
import { exists } from '@withstudiocms/cli-kit/utils';

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

// biome-ignore lint/style/useEnumInitializers: We want the natural number progression for UpdateResult
// biome-ignore lint/suspicious/noConstEnum: Using const enum for better runtime performance
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
		// Remove studiocms prefix and suffix (e.g., studiocms-plugin, studiocms.plugin)
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
	console.debug(
		`No StudioCMS config file found in ${root.toString()}. Searched for: ${configPaths.join(', ')}`
	);
	return undefined;
}

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : `${path}/`;
}
