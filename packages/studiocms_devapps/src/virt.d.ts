/// <reference types="@astrojs/db" />

declare module 'virtual:studiocms-devapps/endpoints' {
	export const wpAPIEndpoint: string;
}

declare module 'virtual:studiocms-devapps/config' {
	export const userProjectRoot: string;
	export const dbEnv: {
		remoteUrl: string;
		token: string;
	};
}

declare module 'virtual:studiocms-devapps/db' {
	const client: import('@libsql/client/web').Client;
	export { client };
}
