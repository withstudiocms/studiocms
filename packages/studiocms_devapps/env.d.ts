/// <reference types="astro/client" />
/// <reference types="../../playground/.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly PROD: boolean;
	readonly BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module 'virtual:studiocms-devapps/libsql-viewer' {
	const value: {
		readonly endpointPath: string;
	};
	export default value;
}

declare module 'virtual:studiocms-devapps/wp-api/configPath' {
	const value: {
		readonly projectRoot: string;
	};
	export default value;
}

declare module 'virtual:studiocms-devapps/wp-api-importer' {
	const value: {
		readonly endpointPath: string;
	};
	export default value;
}
