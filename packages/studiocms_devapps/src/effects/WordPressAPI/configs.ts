import type { APIContext } from 'astro';
import { Context, Effect, Layer } from 'studiocms/effect';
import type { PageData } from './importers.js';

export class StringConfig extends Context.Tag('StringConfig')<
	StringConfig,
	{
		readonly str: string;
	}
>() {
	static makeLayer = (str: string) =>
		Layer.succeed(
			this,
			this.of({
				str,
			})
		);

	static makeProvide = (str: string) => Effect.provide(this.makeLayer(str));
}

type APISupportedTypes = 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'settings';

export class APIEndpointConfig extends Context.Tag('APIEndpointConfig')<
	APIEndpointConfig,
	{
		readonly endpoint: string;
		readonly type: APISupportedTypes;
		readonly path?: string | undefined;
	}
>() {
	static makeLayer = (endpoint: string, type: APISupportedTypes, path?: string) =>
		Layer.succeed(
			this,
			this.of({
				endpoint,
				type,
				path,
			})
		);

	static makeProvide = (endpoint: string, type: APISupportedTypes, path?: string) =>
		Effect.provide(this.makeLayer(endpoint, type, path));
}

export class DownloadImageConfig extends Context.Tag('DownloadImageConfig')<
	DownloadImageConfig,
	{
		readonly imageUrl: string | URL;
		readonly destination: string | URL;
	}
>() {
	static makeLayer = (imageUrl: string | URL, destination: string | URL) =>
		Layer.succeed(
			this,
			this.of({
				imageUrl,
				destination,
			})
		);

	static makeProvide = (imageUrl: string | URL, destination: string | URL) =>
		Effect.provide(this.makeLayer(imageUrl, destination));
}

export class DownloadPostImageConfig extends Context.Tag('DownloadPostImageConfig')<
	DownloadPostImageConfig,
	{
		readonly str: string;
		readonly pathToFolder: string;
	}
>() {
	static makeLayer = (str: string, pathToFolder: string) =>
		Layer.succeed(
			this,
			this.of({
				str,
				pathToFolder,
			})
		);

	static makeProvide = (str: string, pathToFolder: string) =>
		Effect.provide(this.makeLayer(str, pathToFolder));
}

export class ImportEndpointConfig extends Context.Tag('ImportEndpointConfig')<
	ImportEndpointConfig,
	{
		readonly endpoint: string;
	}
>() {
	static makeLayer = (endpoint: string) => Layer.succeed(this, this.of({ endpoint: endpoint }));

	static makeProvide = (endpoint: string) => Effect.provide(this.makeLayer(endpoint));
}

export class ImportPostsEndpointConfig extends Context.Tag('ImportPostsEndpointConfig')<
	ImportPostsEndpointConfig,
	{
		readonly endpoint: string;
		readonly useBlogPkg: boolean;
	}
>() {
	static makeLayer = (endpoint: string, useBlogPkg = false) =>
		Layer.succeed(this, this.of({ endpoint, useBlogPkg }));

	static makeProvide = (endpoint: string, useBlogPkg = false) =>
		Effect.provide(this.makeLayer(endpoint, useBlogPkg));
}

export class AstroAPIContextProvider extends Context.Tag('AstroAPIContextProvider')<
	AstroAPIContextProvider,
	{
		context: APIContext;
	}
>() {
	static makeLayer = (context: APIContext) => Layer.succeed(this, this.of({ context }));

	static makeProvide = (context: APIContext) => Effect.provide(this.makeLayer(context));
}

export class RawPageData extends Context.Tag('RawPageData')<
	RawPageData,
	{
		readonly page: unknown;
	}
>() {
	static makeLayer = (page: unknown) => Layer.succeed(this, this.of({ page: page }));

	static makeProvide = (page: unknown) => Effect.provide(this.makeLayer(page));
}

export class FullPageData extends Context.Tag('FullPageData')<
	FullPageData,
	{
		readonly pageData: PageData;
	}
>() {
	static makeLayer = (pageData: PageData) => Layer.succeed(this, this.of({ pageData: pageData }));

	static makeProvide = (pageData: PageData) => Effect.provide(this.makeLayer(pageData));
}

export class UseBlogPkgConfig extends Context.Tag('UseBlogPkgConfig')<
	UseBlogPkgConfig,
	{
		readonly useBlogPkg: boolean;
	}
>() {
	static makeLayer = (useBlogPkg: boolean) =>
		Layer.succeed(this, this.of({ useBlogPkg: useBlogPkg }));

	static makeProvide = (useBlogPkg: boolean) => Effect.provide(this.makeLayer(useBlogPkg));
}

export class CategoryOrTagConfig extends Context.Tag('CategoryOrTagConfig')<
	CategoryOrTagConfig,
	{
		readonly value: readonly number[];
	}
>() {
	static makeLayer = (value: readonly number[]) => Layer.succeed(this, this.of({ value: value }));

	static makeProvide = (value: readonly number[]) => Effect.provide(this.makeLayer(value));
}
