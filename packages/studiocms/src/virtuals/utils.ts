import type { StudioCMSConfig } from '../schemas/index.js';

export const buildVirtualConfig = (options: StudioCMSConfig): string => `
export const config = ${JSON.stringify(options)};
export default config;
export const dashboardConfig = config.features.dashboardConfig;
export const authConfig = config.features.authConfig;
export const developerConfig = config.features.developerConfig;
export const sdk = config.features.sdk;

// Deprecated alias
export const AuthConfig = authConfig;
`;

// biome-ignore lint/suspicious/noExplicitAny: Match the type input of JSON.stringify
export const buildDefaultOnlyVirtual = (mod: any): string =>
	`export default ${JSON.stringify(mod)};`;

type DynamicExportBuilder = {
	resolve: (...path: Array<string>) => string;
	items: Array<string>;
};

export const buildDynamicOnlyVirtual = (builder: DynamicExportBuilder): string => {
	const { resolve, items } = builder;

	const entries = items.map((item) => `export * from ${JSON.stringify(resolve(item))};`);

	return `${entries.join('\n')}`;
};

export const buildVirtualAmbientScript = ({
	resolve,
	items,
}: {
	resolve: (...path: Array<string>) => string;
	items: string[];
}): string => {
	return items.map((item) => `import '${resolve(item)}';`).join('\n');
};

export const buildNamedVirtual = ({
	resolve,
	namedExport,
	path,
	exportDefault,
}: {
	resolve: (...path: Array<string>) => string;
	namedExport: string;
	path: string;
	exportDefault?: boolean;
}) => `
import { ${namedExport} } from ${JSON.stringify(resolve(path))};
export { ${namedExport} };
${exportDefault ? `export default ${namedExport};` : ''}
`;

export const buildNamedMultiExportVirtual = (items: Record<string, string>) =>
	Object.entries(items)
		.map(([key, val]) => `export const ${key} = ${JSON.stringify(val)};`)
		.join('\n');

export const buildAstroComponentVirtualExport = ({
	resolve,
	items,
}: {
	resolve: (...path: Array<string>) => string;
	items: Record<string, string>;
}) =>
	Object.entries(items)
		.map(([key, val]) => `export { default as ${key} } from ${JSON.stringify(resolve(val))}`)
		.join('\n');

export const buildDynamicAndAstroVirtualExport = ({
	resolve,
	dynamicExports,
	astroComponents,
}: {
	resolve: (...path: Array<string>) => string;
	dynamicExports: Array<string>;
	astroComponents: Record<string, string>;
}) => {
	const dynamicExportMaps = buildDynamicOnlyVirtual({
		resolve,
		items: dynamicExports,
	});

	const astroComponentMaps = buildAstroComponentVirtualExport({
		resolve,
		items: astroComponents,
	});

	return `${dynamicExportMaps}\n${astroComponentMaps}`;
};
