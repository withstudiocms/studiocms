import fs from 'node:fs';
import { createResolver } from 'astro-integration-kit';
import type { StudioCMSConfig } from '../schemas/index.js';

const { resolve } = createResolver(import.meta.url);

// biome-ignore lint/suspicious/noExplicitAny: Match the type input of JSON.stringify
export const buildDefaultOnlyVirtual = (mod: any): string =>
	`export default ${JSON.stringify(mod)};`;

export const buildNamedMultiExportVirtual = (items: Record<string, string>) =>
	Object.entries(items)
		.map(([key, val]) => `export const ${key} = ${JSON.stringify(val)};`)
		.join('\n');

export const buildVirtualModules = (resolve: (...path: Array<string>) => string) => {
	const dynamicVirtual = (items: Array<string>): string =>
		items.map((item) => `export * from ${JSON.stringify(resolve(item))};`).join('\n');

	const ambientScripts = (items: Array<string>): string =>
		items.map((item) => `import '${resolve(item)}';`).join('\n');

	const namedVirtual = ({
		namedExport,
		path,
		exportDefault,
	}: {
		namedExport: string;
		path: string;
		exportDefault?: boolean;
	}) => `
import { ${namedExport} } from ${JSON.stringify(resolve(path))};
export { ${namedExport} };
${exportDefault ? `export default ${namedExport};` : ''}
`;

	const astroComponentVirtual = (items: Record<string, string>) =>
		Object.entries(items)
			.map(([key, val]) => `export { default as ${key} } from ${JSON.stringify(resolve(val))}`)
			.join('\n');

	const dynamicWithAstroVirtual = ({
		dynamicExports,
		astroComponents,
	}: {
		dynamicExports: Array<string>;
		astroComponents: Record<string, string>;
	}) => {
		const dynamic = dynamicVirtual(dynamicExports);
		const astro = astroComponentVirtual(astroComponents);
		return `${dynamic}\n${astro}`;
	};

	return {
		dynamicVirtual,
		ambientScripts,
		namedVirtual,
		astroComponentVirtual,
		dynamicWithAstroVirtual,
	};
};

export const buildLoggerVirtual = (verbose: boolean) => {
	const loggerStub = fs.readFileSync(resolve('./stubs/logger.stub.js'), 'utf-8');

	const loggerContent = loggerStub.replace(/\$\$verbose\$\$/g, verbose.toString());

	return loggerContent;
};

export const buildVirtualConfig = (options: StudioCMSConfig): string => {
	const configStub = fs.readFileSync(resolve('./stubs/config.stub.js'), 'utf-8');

	const configContent = configStub.replace(/\$\$options\$\$/g, JSON.stringify(options));

	return configContent;
};
