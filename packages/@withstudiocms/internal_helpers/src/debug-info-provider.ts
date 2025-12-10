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
	adapterName: string;
	databaseDialect: string;
	installedPlugins: PluginList;
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
		const { adapterName, databaseDialect, installedPlugins } = this.#ctx;

		const [
			{ getPackageManager },
			{ ProcessNodeVersionProvider },
			{ ProcessPackageManagerUserAgentProvider },
			{ ProcessSystemInfoProvider },
			{ TinyexecCommandExecutor },
		] = await Promise.all([
			import('./debug-provider/core/get-package-manger.js'),
			import('./debug-provider/core/process-node-version-provider.js'),
			import('./debug-provider/core/process-package-manager-user-agent-provider.js'),
			import('./debug-provider/core/system-info-provider.js'),
			import('./debug-provider/core/tinyexec.js'),
		]);

		const nodeVersionProvider = new ProcessNodeVersionProvider();
		const packageManagerUserAgentProvider = new ProcessPackageManagerUserAgentProvider();
		const systemInfoProvider = new ProcessSystemInfoProvider();
		const commandExecutor = new TinyexecCommandExecutor();

		const packageManagerProvider = await getPackageManager({
			packageManagerUserAgentProvider,
			commandExecutor,
		});

		async function getVersionWithIdentifier(identifier: string): Promise<string> {
			const version = await packageManagerProvider.getPackageVersion(identifier);
			if (!version) {
				return identifier;
			}
			return `${identifier} (${version})`;
		}

		const fallbackValue = 'Unavailable';

		const AstroVersion = (await packageManagerProvider.getPackageVersion('astro')) || fallbackValue;
		const AstroAdapter = (await getVersionWithIdentifier(adapterName)) || fallbackValue;
		const DatabaseDialect =
			dbDialectLabels[databaseDialect as keyof typeof dbDialectLabels] ?? databaseDialect;

		const StudioCMSVersion =
			(await packageManagerProvider.getPackageVersion('studiocms')) || fallbackValue;
		const StudioCMSUiVersion =
			(await packageManagerProvider.getPackageVersion('@studiocms/ui')) || fallbackValue;

		return {
			Astro: AstroVersion,
			'Astro Adapter': AstroAdapter,
			'Database Dialect': DatabaseDialect,
			'Node.js': nodeVersionProvider.version,
			'Package Manager': packageManagerProvider.name,
			System: systemInfoProvider.displayName,
			StudioCMS: StudioCMSVersion,
			'StudioCMS UI': StudioCMSUiVersion,
			'StudioCMS Plugins': await Promise.all(
				installedPlugins.map(
					async ({ identifier, name }) => `${name} - ${await getVersionWithIdentifier(identifier)}`
				)
			).then((versions) => versions.join('\n')),
		};
	}

	/**
	 * Gathers debug information as a formatted string.
	 *
	 * @returns A promise that resolves to the debug information string.
	 */
	async getDebugInfoString(
		indent?: number,
		{ styled, styles: style }: { styled: boolean; styles?: FormatOptions } = {
			styled: false,
		}
	): Promise<string> {
		const debugInfo = await this.getDebugInfoObj();
		const styler = new DebugStyler(debugInfo, { indent, style });
		return styler.format(styled);
	}
}
