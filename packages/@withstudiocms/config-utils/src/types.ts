import type { Schema } from 'effect';

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
