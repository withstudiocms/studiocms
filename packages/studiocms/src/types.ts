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

export type Messages = {
	label: string;
	logLevel: 'info' | 'warn' | 'error' | 'debug';
	message: string;
}[];

export type ServerStartOptions = {
	pkgName: string;
	pkgVersion: string;
	verbose: boolean;
	messages: Messages;
};

export type ConfigSetupOptions = {
	pkgName: string;
	pkgVersion: string;
	opts: StudioCMSOptions;
	messages: Messages;
};
