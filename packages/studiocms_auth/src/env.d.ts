interface ImportMetaEnv {
	readonly PROD: boolean;
	readonly BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

type ImageMetadata = import('astro').ImageMetadata;

declare module '*.png' {
	const metadata: ImageMetadata;
	export default metadata;
}
