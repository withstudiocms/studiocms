/**
 * Arguments for importing a bundled file.
 *
 * @property code - The source code of the bundled file as a string.
 * @property root - The root URL used as the base for resolving file paths.
 * @property label - (Optional) A label for the temporary file, useful for identification or debugging.
 */
export interface ImportBundledFileArgs {
	code: string;
	root: URL;
	label?: string; // Optional label for the temporary file
}

/**
 * Arguments for loading and bundling a configuration file.
 *
 * @property root - The root directory as a URL.
 * @property fileUrl - The URL of the configuration file to load, or undefined if not specified.
 * @property label - (Optional) A label for the temporary file, used for identification or logging.
 */
export interface LoadAndBundleConfigFileArgs {
	root: URL;
	fileUrl: URL | undefined;
	label?: string; // Optional label for the temporary file
}

/**
 * The result of loading and bundling a configuration file.
 *
 * @property mod - The loaded module, which may contain a `default` export of any type, or be undefined if loading failed.
 * @property dependencies - An array of file paths representing the dependencies of the loaded configuration file.
 */
export interface LoadAndBundleConfigFileResult {
	mod: { default?: unknown } | undefined;
	dependencies: string[];
}

/**
 * Options for building a configuration resolver.
 *
 * @template Schema - The type of the Zod schema used for validation.
 * @property configPaths - An array of file paths to search for configuration files.
 * @property label - A human-readable label describing the configuration.
 * @property zodSchema - The Zod schema instance used to validate the configuration.
 */
export interface ConfigResolverBuilderOpts<Schema> {
	configPaths: string[];
	label: string;
	zodSchema: Schema;
}

/**
 * Options for watching configuration files.
 *
 * @property configPaths - An array of file paths to configuration files that should be watched.
 */
export interface WatchConfigFileOptions {
	configPaths: string[];
}
