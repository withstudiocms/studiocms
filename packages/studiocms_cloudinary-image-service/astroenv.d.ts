/// <reference types="astro/client" />

declare module 'astro:env/server' {
	export const CMS_ENCRYPTION_KEY: string;
	export const CMS_GITHUB_CLIENT_ID: string | undefined;
	export const CMS_GITHUB_CLIENT_SECRET: string | undefined;
	export const CMS_GITHUB_REDIRECT_URI: string | undefined;
	export const CMS_DISCORD_CLIENT_ID: string | undefined;
	export const CMS_DISCORD_CLIENT_SECRET: string | undefined;
	export const CMS_DISCORD_REDIRECT_URI: string | undefined;
	export const CMS_GOOGLE_CLIENT_ID: string | undefined;
	export const CMS_GOOGLE_CLIENT_SECRET: string | undefined;
	export const CMS_GOOGLE_REDIRECT_URI: string | undefined;
	export const CMS_AUTH0_CLIENT_ID: string | undefined;
	export const CMS_AUTH0_CLIENT_SECRET: string | undefined;
	export const CMS_AUTH0_DOMAIN: string | undefined;
	export const CMS_AUTH0_REDIRECT_URI: string | undefined;
	export const CMS_CLOUDINARY_CLOUDNAME: string | undefined;
}
