import fs from 'node:fs';
import { createResolver } from 'astro-integration-kit';
import type { StudioCMSConfig } from '../schemas/index.js';

const { resolve } = createResolver(import.meta.url);

/**
 * Builds a string representing a default export of the provided module object.
 *
 * @param mod - The module object to be stringified and exported as default.
 * @returns A string containing a TypeScript/JavaScript default export statement with the serialized module.
 */
// biome-ignore lint/suspicious/noExplicitAny: Match the type input of JSON.stringify
export const buildDefaultOnlyVirtual = (mod: any): string =>
	`export default ${JSON.stringify(mod)};`;

/**
 * Builds a string containing multiple named ES module exports from a record of key-value pairs.
 *
 * Each key in the input object becomes the exported constant's name, and each value is stringified
 * and assigned to the corresponding export.
 *
 * @param items - An object where each key-value pair represents the name and value of an export.
 * @returns A string containing multiple export statements, one for each entry in the input object.
 *
 * @example
 * ```typescript
 * const exports = buildNamedMultiExportVirtual({ foo: "bar", baz: "qux" });
 * // exports:
 * // export const foo = "bar";
 * // export const baz = "qux";
 * ```
 */
export const buildNamedMultiExportVirtual = (items: Record<string, string>) =>
	Object.entries(items)
		.map(([key, val]) => `export const ${key} = ${JSON.stringify(val)};`)
		.join('\n');

/**
 * Factory function to build utilities for generating virtual module code strings.
 *
 * @param resolve - A function that resolves a list of path segments into a string path.
 * @returns An object containing utilities for generating virtual module code:
 * - `dynamicVirtual`: Generates export statements for a list of module paths.
 * - `ambientScripts`: Generates import statements for a list of module paths (for side effects).
 * - `namedVirtual`: Generates code to re-export a named export (and optionally as default) from a module.
 * - `astroComponentVirtual`: Generates export statements for Astro components with custom names.
 * - `dynamicWithAstroVirtual`: Generates combined exports for dynamic modules and Astro components.
 */
export const buildVirtualModules = (resolve: (...path: Array<string>) => string) => {
	/**
	 * Generates export statements for a list of module paths.
	 */
	const dynamicVirtual = (items: Array<string>): string =>
		items.map((item) => `export * from ${JSON.stringify(resolve(item))};`).join('\n');

	/**
	 * Generates import statements for a list of module paths (for side effects).
	 */
	const ambientScripts = (items: Array<string>): string =>
		items.map((item) => `import '${resolve(item)}';`).join('\n');

	/**
	 * Generates code to re-export a named export (and optionally as default) from a module.
	 */
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

	/**
	 * Generates export statements for Astro components with custom names.
	 */
	const astroComponentVirtual = (items: Record<string, string>) =>
		Object.entries(items)
			.map(([key, val]) => `export { default as ${key} } from ${JSON.stringify(resolve(val))}`)
			.join('\n');

	/**
	 * Generates combined exports for dynamic modules and Astro components.
	 */
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

/**
 * Builds the virtual configuration file content by injecting the provided StudioCMS options
 * into a configuration stub template.
 *
 * @param options - The configuration options to be injected into the stub template.
 * @returns The resulting configuration file content as a string with the options embedded.
 */
export const buildVirtualConfig = (options: StudioCMSConfig): string => {
	const configStub = fs.readFileSync(resolve('./stubs/config.stub.js'), 'utf-8');

	const configContent = configStub.replace(/\$\$options\$\$/g, JSON.stringify(options));

	return configContent;
};

/**
 * Builds the content for a logger virtual file by reading a logger stub file and replacing
 * the `$$verbose$$` placeholder with the provided verbosity flag.
 *
 * @param verbose - Determines whether verbose logging should be enabled.
 * @returns The logger file content with the verbosity setting applied.
 */
export const buildLoggerVirtual = (verbose: boolean) => {
	const loggerStub = fs.readFileSync(resolve('./stubs/logger.stub.js'), 'utf-8');

	const loggerContent = loggerStub.replace(/\$\$verbose\$\$/g, verbose.toString());

	return loggerContent;
};
