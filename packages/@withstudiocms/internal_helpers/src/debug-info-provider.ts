import type { AstroGlobal } from 'astro';
import { DebugStyler, type FormatOptions } from './debug-provider/core/debug-styler.js';

/**
 * Represents debug information about the Astro and StudioCMS environment.
 */
export type DebugInfo = {
	Astro: string;
	'Astro Adapter': string;
	'Database Dialect': string;
	'Node.js': string;
	'Package Manager': string;
	System: string;
	StudioCMS: string;
	'StudioCMS UI': string;
	'StudioCMS Plugins': string;
};

/**
 * Represents a list of installed plugins.
 */
type PluginList = {
	identifier: string;
	name: string;
}[];

/**
 * Represents the context required to gather debug information.
 */
export interface DebugInfoContext {
	Astro: Pick<AstroGlobal, 'generator' | 'locals'>;
	adapterName: string;
	databaseDialect: string;
	installedPlugins: PluginList;
}

/**
 * Strips namespace prefixes from version strings.
 *
 * @param versionString - The version string to process.
 * @returns The version string without namespace prefixes.
 *
 * @example
 * stripNamespace('Astro v3.5.0'); // Returns 'v3.5.0'
 */
function stripNamespace(versionString: string) {
	return versionString.replace(/^[^\d]*/, 'v');
}

// Database dialect labels
const dbDialectLabels = {
	libsql: 'LibSQL',
	mysql: 'MySQL',
	postgres: 'PostgreSQL',
	sqlite: 'SQLite',
};

export class DebugInfoProvider {
	#ctx: DebugInfoContext;

	constructor(ctx: DebugInfoContext) {
		this.#ctx = ctx;
	}

	/**
	 * Gathers debug information as an object.
	 *
	 * @returns A promise that resolves to the debug information object.
	 */
	async getDebugInfoObj(): Promise<DebugInfo> {
		const { Astro, adapterName, databaseDialect, installedPlugins } = this.#ctx;

		const [
			{ getPackageManager },
			{ ProcessNodeVersionProvider },
			{ ProcessPackageManagerUserAgentProvider },
			{ ProcessSystemInfoProvider },
		] = await Promise.all([
			import('./debug-provider/core/get-package-manger.js'),
			import('./debug-provider/core/process-node-version-provider.js'),
			import('./debug-provider/core/process-package-manager-user-agent-provider.js'),
			import('./debug-provider/core/system-info-provider.js'),
		]);

		const nodeVersionProvider = new ProcessNodeVersionProvider();
		const packageManagerUserAgentProvider = new ProcessPackageManagerUserAgentProvider();
		const systemInfoProvider = new ProcessSystemInfoProvider();

		const packageManagerProvider = await getPackageManager({ packageManagerUserAgentProvider });

		const AstroVersion = stripNamespace(Astro.generator);
		const AstroAdapter = adapterName;
		const DatabaseDialect =
			dbDialectLabels[databaseDialect as keyof typeof dbDialectLabels] ?? databaseDialect;

		const StudioCMSVersion = stripNamespace(Astro.locals.StudioCMS.SCMSGenerator);
		const StudioCMSUiVersion = stripNamespace(Astro.locals.StudioCMS.SCMSUiGenerator);

		return {
			Astro: AstroVersion,
			'Astro Adapter': AstroAdapter,
			'Database Dialect': DatabaseDialect,
			'Node.js': nodeVersionProvider.version,
			'Package Manager': packageManagerProvider.name,
			System: systemInfoProvider.displayName,
			StudioCMS: StudioCMSVersion,
			'StudioCMS UI': StudioCMSUiVersion,
			'StudioCMS Plugins': installedPlugins
				.map(({ identifier, name }) => `${name} (${identifier})`)
				.join('\n'),
		};
	}

	/**
	 * Gathers debug information as a formatted string.
	 *
	 * @returns A promise that resolves to the debug information string.
	 */
	async getDebugInfoString(indent?: number): Promise<string> {
		const styler = new DebugStyler(indent);
		const debugInfo = await this.getDebugInfoObj();
		return styler.format(debugInfo);
	}

	/**
	 * Gathers debug information as a formatted and styled string.
	 *
	 * @returns A promise that resolves to the styled debug information string.
	 */
	async getDebugInfoStyledString(indent?: number, options?: FormatOptions): Promise<string> {
		const styler = new DebugStyler(indent);
		const debugInfo = await this.getDebugInfoObj();
		return styler.formatStyled(debugInfo, options);
	}
}
