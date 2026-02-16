import { extname } from 'node:path';
import { ParseResult, Schema } from 'effect';
import { type HeadConfig, HeadConfigSchema, type HeadUserConfig } from 'studiocms/lib/head';

export type { HeadConfig, HeadUserConfig };

export const faviconTypeMap = {
	'.ico': 'image/x-icon',
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
};

export function isFaviconExt(ext: string): ext is keyof typeof faviconTypeMap {
	return ext in faviconTypeMap;
}

export const FaviconSchema = Schema.transformOrFail(Schema.String, Schema.String, {
	strict: true,
	decode: (input, _options, ast) => {
		const ext = extname(input).toLocaleLowerCase();
		if (!isFaviconExt(ext)) {
			return ParseResult.fail(
				new ParseResult.Type(ast, input, 'favicon must be a .ico, .gif, .jpg, .png, or .svg file')
			);
		}
		return ParseResult.succeed(input);
	},
	encode: (input) => ParseResult.succeed(input),
}).annotations({
	title: 'Favicon',
	identifier: 'FaviconSchema',
	description: 'The path to the favicon file. Must be a .ico, .gif, .jpg, .png, or .svg file.',
	examples: ['/favicon.ico', '/favicon.png', '/favicon.svg'],
});

export const FrontEndBlogSchema = Schema.Struct({
	title: Schema.optionalWith(Schema.String, {
		default: () => 'Blog',
	}).annotations({
		description: 'The title of the blog',
	}),
	enableRSS: Schema.optionalWith(Schema.Boolean, {
		default: () => true,
	}).annotations({
		description: 'Enable RSS feed',
	}),
	route: Schema.optionalWith(Schema.String, {
		default: () => '/blog',
	}).annotations({
		description: 'The route for the blog',
		examples: ['/blog', '/news', '/articles'],
	}),
}).annotations({
	description: 'The configuration for the blog',
});

export const FrontEndConfigSchema = Schema.Struct({
	htmlDefaultLanguage: Schema.optionalWith(Schema.String, {
		default: () => 'en',
	}).annotations({
		description: 'The default language for the HTML tag',
	}),
	htmlDefaultHead: HeadConfigSchema.fields.head.annotations({
		description: 'The default head configuration for the Frontend',
	}),
	favicon: Schema.optionalWith(FaviconSchema, {
		default: () => '/favicon.svg',
	}).annotations({
		description: 'The default favicon configuration for the Frontend',
	}),
	sitemap: Schema.optionalWith(Schema.Boolean, {
		default: () => true,
	}).annotations({
		description: 'Enable sitemap generation',
	}),
	injectRoutes: Schema.optionalWith(Schema.Boolean, {
		default: () => true,
	}).annotations({
		description: 'Inject routes',
	}),
	blog: Schema.optionalWith(FrontEndBlogSchema, {
		default: () => FrontEndBlogSchema.make({}),
	}).annotations({
		description: 'The configuration for the blog',
	}),
});

export type StudioCMSBlogOptions = typeof FrontEndConfigSchema.Encoded;
