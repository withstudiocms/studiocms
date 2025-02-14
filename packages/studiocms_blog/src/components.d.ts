/// <reference types="astro/client" />

declare module 'studiocms:components' {
	export const Avatar: typeof import('studiocms/components/Avatar.astro').default;
	export const FormattedDate: typeof import('studiocms/components/FormattedDate.astro').default;
	export const GenericHeader: typeof import('studiocms/components/GenericHeader.astro').default;
	export const Navigation: typeof import('studiocms/components/Navigation.astro').default;
	export const Generator: typeof import('studiocms/components/Generator.astro').default;
}

declare module 'studiocms:imageHandler/components' {
	export const CustomImage: typeof import('studiocms/components/image/CustomImage.astro').default;
}
