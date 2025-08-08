/// <reference types="../ui.d.ts" />
/// <reference types="../astroenv.d.ts" />
import type { InjectedRoute, InjectedScriptStage } from 'astro';
import type { StudioCMSOptions } from './schemas/index.js';
import type { CombinedPageData } from './sdk/types/index.js';

/**
 * Represents an array of message objects.
 * Each message object contains information about a log message.
 *
 * @property {string} label - The label associated with the message.
 * @property {'info' | 'warn' | 'error' | 'debug'} logLevel - The level of the log message.
 * @property {string} message - The content of the log message.
 */
export type Messages = {
	label: string;
	logLevel: 'info' | 'warn' | 'error' | 'debug';
	message: string;
}[];

/**
 * Represents a route object that can be used for a Array of routes for the Astro integration injectRoute() function.
 */
export type Route = InjectedRoute & { enabled: boolean };

/**
 * Represents a script object that can be used for a Array of scripts for the Astro integration injectScript() function.
 */
export type Script = { stage: InjectedScriptStage; content: string; enabled: boolean };

/**
 * Options for starting the server.
 *
 * @property {string} pkgName - The name of the package.
 * @property {string} pkgVersion - The version of the package.
 * @property {boolean} verbose - Flag to enable verbose logging.
 * @property {Messages} messages - The messages configuration.
 */
export type ServerStartOptions = {
	pkgName: string;
	pkgVersion: string;
	verbose: boolean;
	messages: Messages;
};

/**
 * Options for setting up the configuration.
 *
 * @property pkgName - The name of the package.
 * @property pkgVersion - The version of the package.
 * @property opts - The options for StudioCMS.
 * @property messages - The messages to be used.
 */
export type ConfigSetupOptions = {
	pkgName: string;
	pkgVersion: string;
	opts: StudioCMSOptions;
	messages: Messages;
};

/**
 * A utility type that recursively makes all properties of a given type `T` optional.
 *
 * This is particularly useful for creating partial versions of deeply nested objects.
 *
 * @template T - The type to be transformed into a deep partial.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PluginPageTypeRendererProps {
	data: DeepPartial<CombinedPageData>;
}

export interface PluginPageTypeEditorProps {
    /**
     * Page identifier useful for identifying the page in the editor.
	 * This is used to identify the page in the editor and should be unique.
     */
    id?: string;

	/**
	 * The content of the page from the database
	 */
	content?: string;
}
