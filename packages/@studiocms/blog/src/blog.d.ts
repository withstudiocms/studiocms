declare module 'studiocms:blog/config' {
	const config: {
		title: string;
		enableRSS: boolean;
		route: string;
	};
	export default config;
}

declare module 'studiocms:blog/frontend-config' {
	const config: {
		htmlDefaultLanguage: string;
		htmlDefaultHead: {
			tag: 'title' | 'base' | 'link' | 'style' | 'meta' | 'script' | 'noscript' | 'template';
			attrs: Record<string, string | boolean | undefined>;
			content: string;
		}[];
		favicon: string;
	};
	export default config;
}
