/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS integration in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="../renderer.d.ts" />
/// <reference types="../core.d.ts" />
/// <reference types="../auth.d.ts" />
/// <reference types="../ui.d.ts" />

import type { StudioCMSOptions } from './schemas/index.js';

/**
 * Represents an array of message objects.
 * Each message object contains information about a log message.
 *
 * @typedef {Object} Messages
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
