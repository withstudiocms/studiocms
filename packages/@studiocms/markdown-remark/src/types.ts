import type { AstroConfig, AstroUserConfig, RemotePattern } from 'astro';
import type { HTMLString } from 'astro/runtime/server/index.js';

type NoUndefined<T> = T extends undefined ? never : T;

type RecursiveRequired<T> = {
	[K in keyof T]-?: T[K] extends object ? RecursiveRequired<T[K]> : T[K];
};

export type AstroMarkdownConfig = AstroConfig['markdown'];
export type AstroUserMarkdownConfig = NoUndefined<AstroUserConfig['markdown']>;

export interface StudioCMSCalloutOptions {
	theme?: 'github' | 'obsidian' | 'vitepress';
}

export interface StudioCMSMarkdownOptions extends AstroUserMarkdownConfig {
	studiocms?: {
		callouts?: StudioCMSCalloutOptions | false;
		autolink?: boolean;
		discordSubtext?: boolean;
	};
}

export type StudioCMSMarkdownConfig = RecursiveRequired<StudioCMSMarkdownOptions>;

export interface StudioCMSMarkdownProcessorOptions extends StudioCMSMarkdownOptions {
	image?: {
		domains?: string[];
		remotePatterns?: RemotePattern[];
	};
	experimentalHeadingIdCompat?: boolean;
}

export interface MarkdownProcessor {
	render: (
		content: string,
		opts?: MarkdownProcessorRenderOptions
	) => Promise<MarkdownProcessorRenderResult>;
}

export interface MarkdownProcessorRenderOptions {
	/** @internal */
	fileURL?: URL;
	/** Used for frontmatter injection plugins */
	// biome-ignore lint/suspicious/noExplicitAny: Type of frontmatter can vary greatly depending on the user's content, so we allow any shape here.
	frontmatter?: Record<string, any>;
}

export interface MarkdownProcessorRenderResult {
	code: string;
	astroHTML: HTMLString;
	metadata: {
		headings: MarkdownHeading[];
		localImagePaths: string[];
		remoteImagePaths: string[];
		// biome-ignore lint/suspicious/noExplicitAny: Type of frontmatter can vary greatly depending on the user's content, so we allow any shape here.
		frontmatter: Record<string, any>;
	};
}

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}
