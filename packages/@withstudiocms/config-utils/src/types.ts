import type { Schema } from 'effect';

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
 * Options for building an effect-based configuration resolver.
 *
 * @template A - The type of the configuration object that will be produced by the effect.
 * @template I - The type of the input to the effect that produces the configuration object.
 * @property configPaths - An array of file paths to search for configuration files.
 * @property label - A human-readable label describing the configuration.
 * @property effectSchema - The schema for the effect that will produce the configuration object.
 */
export interface ConfigResolverBuilderEffectOpts<A, I> {
	configPaths: string[];
	label: string;
	effectSchema: Schema.Schema<A, I, never>;
}

/**
 * Options for watching configuration files.
 *
 * @property configPaths - An array of file paths to configuration files that should be watched.
 */
export interface WatchConfigFileOptions {
	configPaths: string[];

	/**
	 * For testing purposes only: collects logs and errors encountered during the watch process.
	 */
	_test_report?: {
		logs: string[];
		errors: string[];
	};
}
