/// <reference types="../../playground/.astro/types.d.ts" />
/// <reference types="../../playground/.astro/@studiocms/blog.d.ts" />

interface ImportMetaEnv {
	readonly PROD: boolean;
	readonly BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
