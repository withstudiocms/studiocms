import type { StudioCMSOptions } from '@studiocms/core/schemas';

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
