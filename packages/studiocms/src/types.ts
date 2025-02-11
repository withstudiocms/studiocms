/// <reference types="../renderer.d.ts" />
/// <reference types="../core.d.ts" />

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
