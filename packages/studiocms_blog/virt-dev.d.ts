/// <reference types="../studiocms_core/virtuals.d.ts" />
/// <reference types="../studiocms_imagehandler/virtuals.d.ts" />
/// <reference types="../studiocms_renderers/virtuals.d.ts" />

interface ImportMetaEnv {
	readonly PROD: boolean;
	readonly BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
