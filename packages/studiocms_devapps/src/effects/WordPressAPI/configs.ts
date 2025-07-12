import type { APIContext } from 'astro';
import { Context, Effect, Layer } from 'studiocms/effect';
import type { PageData } from './importers.js';

export class StringConfig extends Context.Tag('StringConfig')<
	StringConfig,
	{
		readonly str: Effect.Effect<string>;
	}
>() {
	static makeLayer = (str: string) =>
		Layer.succeed(
			this,
			this.of({
				str: Effect.succeed(str),
			})
		);

	static makeProvide = (str: string) => Effect.provide(this.makeLayer(str));
}

type APISupportedTypes = 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'settings';

export class APIEndpointConfig extends Context.Tag('APIEndpointConfig')<
	APIEndpointConfig,
	{
		readonly config: Effect.Effect<{
			readonly endpoint: string;
			readonly type: APISupportedTypes;
			readonly path?: string | undefined;
		}>;
	}
>() {
	static makeLayer = (endpoint: string, type: APISupportedTypes, path?: string) =>
		Layer.succeed(
			this,
			this.of({
				config: Effect.succeed({ endpoint, type, path }),
			})
		);

	static makeProvide = (endpoint: string, type: APISupportedTypes, path?: string) =>
		Effect.provide(this.makeLayer(endpoint, type, path));
}

export class DownloadImageConfig extends Context.Tag('DownloadImageConfig')<
	DownloadImageConfig,
	{
		readonly config: Effect.Effect<{
			readonly imageUrl: string | URL;
			readonly destination: string | URL;
		}>;
	}
>() {
	static makeLayer = (imageUrl: string | URL, destination: string | URL) =>
		Layer.succeed(
			this,
			this.of({
				config: Effect.succeed({ imageUrl, destination }),
			})
		);

	static makeProvide = (imageUrl: string | URL, destination: string | URL) =>
		Effect.provide(this.makeLayer(imageUrl, destination));
}

export class DownloadPostImageConfig extends Context.Tag('DownloadPostImageConfig')<
	DownloadPostImageConfig,
	{
		readonly config: Effect.Effect<{
			readonly str: string;
			readonly pathToFolder: string;
		}>;
	}
>() {
	static makeLayer = (str: string, pathToFolder: string) =>
		Layer.succeed(
			this,
			this.of({
				config: Effect.succeed({ str, pathToFolder }),
			})
		);

	static makeProvide = (str: string, pathToFolder: string) =>
		Effect.provide(this.makeLayer(str, pathToFolder));
}

export class ImportEndpointConfig extends Context.Tag('ImportEndpointConfig')<
	ImportEndpointConfig,
	{
		readonly endpoint: Effect.Effect<string>;
	}
>() {
	static makeLayer = (endpoint: string) =>
		Layer.succeed(this, this.of({ endpoint: Effect.succeed(endpoint) }));

	static makeProvide = (endpoint: string) => Effect.provide(this.makeLayer(endpoint));
}

export class ImportPostsEndpointConfig extends Context.Tag('ImportPostsEndpointConfig')<
	ImportPostsEndpointConfig,
	{
		readonly config: Effect.Effect<{
			readonly endpoint: string;
			readonly useBlogPkg: boolean;
		}>;
	}
>() {
	static makeLayer = (endpoint: string, useBlogPkg = false) =>
		Layer.succeed(this, this.of({ config: Effect.succeed({ endpoint, useBlogPkg }) }));

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
		readonly page: Effect.Effect<unknown>;
	}
>() {
	static makeLayer = (page: unknown) => Layer.succeed(this, this.of({ page: Effect.succeed(page) }));

	static makeProvide = (page: unknown) => Effect.provide(this.makeLayer(page));
}

export class FullPageData extends Context.Tag('FullPageData')<
	FullPageData,
	{
		readonly pageData: Effect.Effect<PageData>;
	}
>() {
	static makeLayer = (pageData: PageData) => Layer.succeed(this, this.of({ pageData: Effect.succeed(pageData) }));

	static makeProvide = (pageData: PageData) => Effect.provide(this.makeLayer(pageData));
}

export class useBlogPkgConf extends Context.Tag('useBlogPkgConf')<
	useBlogPkgConf,
	{
		readonly useBlogPkg: Effect.Effect<boolean>;
	}
>() {
	static makeLayer = (useBlogPkg: boolean) => Layer.succeed(this, this.of({ useBlogPkg: Effect.succeed(useBlogPkg) }));

	static makeProvide = (useBlogPkg: boolean) => Effect.provide(this.makeLayer(useBlogPkg));
}

export class CategoryOrTagConfig extends Context.Tag('CategoryOrTagConfig')<
	CategoryOrTagConfig,
	{
		readonly value: Effect.Effect<number[]>;
	}
>() {
	static makeLayer = (value: number[]) => Layer.succeed(this, this.of({ value: Effect.succeed(value) }));

	static makeProvide = (value: number[]) => Effect.provide(this.makeLayer(value));
}
