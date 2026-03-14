/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed */

/**
 * Package author information.
 * @see https://docs.npmjs.com/files/package.json#people-fields-author-contributors
 * @see https://yarnpkg.com/en/docs/package-json#toc-author
 */
export interface IAuthor {
	email?: string;
	name: string;
	url?: string;
}

/**
 * An executable file which will be installed into the PATH
 * with a package install. `npm` will symlink that file into
 * `prefix/bin` for global installs, or `./node_modules/.bin/`
 * for local installs.
 *
 * ```json
 * {
 *   "bin" : {
 *     "myapp" : "./cli.js"
 *   }
 * }
 * ```
 *
 * For example, with linux if you install `myapp`,
 * it'll create a symlink from the `cli.js` script
 * to `/usr/local/bin/myapp`.
 * @see https://docs.npmjs.com/files/package.json#bin
 */
export interface IBinMap {
	[commandName: string]: string;
}

/**
 * Browser field replacement map.
 * Maps module paths to browser-specific alternatives or `false` to ignore.
 *
 * ```json
 * {
 *   "browser": {
 *     "./lib/server.js": "./lib/browser.js",
 *     "fs": false
 *   }
 * }
 * ```
 * @see https://github.com/defunctzombie/package-browser-field-spec
 */
export interface IBrowserMap {
	[modulePath: string]: string | false;
}

/**
 * The url to your project's issue tracker and (or) the email
 * address to which issues should be reported. These are helpful
 * for people who encounter issues with your package.
 * @see https://docs.npmjs.com/files/package.json#bugs
 * @see https://yarnpkg.com/en/docs/package-json#toc-bugs
 */
export interface IBugs {
	email?: string;
	url?: string;
}

/**
 * A `config` object can be used to set configuration parameters
 * used in package scripts that persist across upgrades.
 * For instance, if a package had the following:
 * ```json
 * {
 *   "config" : {
 *     "port" : "8080"
 *   }
 * }
 * ```
 * and then had a `start` command that then referenced the
 * `npm_package_config_port` environment variable,
 * then the user could override that by doing npm config set `foo:port 8001`.
 * @see https://docs.npmjs.com/files/package.json#config
 * @see https://yarnpkg.com/en/docs/package-json#toc-config
 */
export interface IConfig {
	[key: string]: string;
}

/**
 * @see http://wiki.commonjs.org/wiki/Packages/1.0
 * @see https://docs.npmjs.com/files/package.json#dependencies
 * @see https://yarnpkg.com/en/docs/package-json#toc-dependencies
 * @see https://docs.npmjs.com/files/package.json#devdependencies
 * @see https://yarnpkg.com/en/docs/package-json#toc-devdependencies
 * @see https://docs.npmjs.com/files/package.json#optionaldependencies
 * @see https://yarnpkg.com/en/docs/package-json#toc-optionaldependencies
 * @see https://docs.npmjs.com/files/package.json#peerdependencies
 * @see https://yarnpkg.com/en/docs/package-json#toc-peerdependencies
 */
export interface IDependencyMap {
	[packageName: string]: string;
}

/**
 * You can specify exact locations to put binary files, man pages,
 * documentation, examples, etc. Package manager tools must use
 * these directory definitions to find various package components.
 * ```
 * {
 *   "directories": {
 *     "lib": "path/to/lib/",
 *     "bin": "path/to/bin/",
 *     "man": "path/to/man/",
 *     "doc": "path/to/doc/",
 *     "example": "path/to/example/"
 *   }
 * }
 * ```
 * @see http://wiki.commonjs.org/wiki/Packages/1.0
 * @see https://docs.npmjs.com/files/package.json#directories
 * @see https://yarnpkg.com/en/docs/package-json#toc-directories
 */
export interface IDirectories {
	/**
	 * If you specify a bin directory in directories.bin,
	 * all the files in that folder will be added.
	 * Because of the way the bin directive works,
	 * specifying both a bin path and setting directories.bin
	 * is an error. If you want to specify individual files,
	 * use bin, and for all the files in an existing bin directory,
	 * use directories.bin.
	 */
	bin?: string;

	/**
	 * Put markdown doc files in here.
	 */
	doc?: string;

	/**
	 * Put example scripts in here.
	 */
	example?: string;

	/**
	 * Tell people where the bulk of your library is.
	 * Nothing special is done with the `lib` folder
	 * in any way, but it's useful meta info.
	 */
	lib?: string;

	/**
	 * A folder that is full of man pages. Sugar to generate
	 * a `man` array by walking the folder.
	 */
	man?: string;

	/**
	 * Put your tests in here.
	 */
	test?: string;
}

/**
 * You can specify the version of node that your stuff works on.
 * You can also specify which versions of npm are capable
 * of properly installing your program.
 * @see https://docs.npmjs.com/files/package.json#engines
 * @see https://yarnpkg.com/en/docs/package-json#toc-engines
 */
export interface IEngines {
	[field: string]: any;
	node?: string;
	npm?: string;
	pnpm?: string;
	yarn?: string;
	zlib?: string;
}

/**
 * Runtime specification for devEngines field.
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#devengines
 */
export interface IDevEngineRuntime {
	/**
	 * The name of the runtime (e.g., "node", "bun", "deno").
	 */
	name?: string;

	/**
	 * The version range of the runtime.
	 */
	version?: string;

	/**
	 * An error to show when the engine doesn't match.
	 * If true, mismatches will cause an error. If false, only a warning.
	 */
	onFail?: 'error' | 'warn' | 'ignore';
}

/**
 * Package manager specification for devEngines field.
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#devengines
 */
export interface IDevEnginePackageManager {
	/**
	 * The name of the package manager (e.g., "npm", "yarn", "pnpm").
	 */
	name?: string;

	/**
	 * The version range of the package manager.
	 */
	version?: string;

	/**
	 * An error to show when the package manager doesn't match.
	 * If true, mismatches will cause an error. If false, only a warning.
	 */
	onFail?: 'error' | 'warn' | 'ignore';
}

/**
 * Development engine requirements.
 * Allows specifying runtime and package manager requirements
 * that only apply during development.
 *
 * ```json
 * {
 *   "devEngines": {
 *     "runtime": {
 *       "name": "node",
 *       "version": ">=20.0.0",
 *       "onFail": "error"
 *     },
 *     "packageManager": {
 *       "name": "npm",
 *       "version": ">=10.0.0",
 *       "onFail": "warn"
 *     }
 *   }
 * }
 * ```
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#devengines
 */
export interface IDevEngines {
	/**
	 * Runtime requirements for development.
	 */
	runtime?: IDevEngineRuntime | IDevEngineRuntime[];

	/**
	 * Package manager requirements for development.
	 */
	packageManager?: IDevEnginePackageManager | IDevEnginePackageManager[];
}

/**
 * Conditional export entry for the `exports` field.
 * Allows specifying different entry points based on conditions
 * like `import`, `require`, `node`, `browser`, etc.
 *
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "import": {
 *         "types": "./dist/esm/index.d.ts",
 *         "default": "./dist/esm/index.js"
 *       },
 *       "require": {
 *         "types": "./dist/cjs/index.d.ts",
 *         "default": "./dist/cjs/index.js"
 *       }
 *     }
 *   }
 * }
 * ```
 * @see https://nodejs.org/api/packages.html#conditional-exports
 */
export interface IConditionalExport {
	/**
	 * Entry point when loaded via `import` or `import()`.
	 */
	import?: string | IConditionalExport;

	/**
	 * Entry point when loaded via `require()`.
	 */
	require?: string | IConditionalExport;

	/**
	 * Entry point for any Node.js environment.
	 */
	node?: string | IConditionalExport;

	/**
	 * Entry point for Node.js addon modules.
	 */
	'node-addons'?: string | IConditionalExport;

	/**
	 * Generic fallback that always matches. Must be the last condition.
	 */
	default?: string | IConditionalExport;

	/**
	 * TypeScript type definitions entry point.
	 */
	types?: string;

	/**
	 * Entry point for browser environments.
	 */
	browser?: string | IConditionalExport;

	/**
	 * Entry point for Deno runtime.
	 * @see https://deno.land/manual/node/package_json
	 */
	deno?: string | IConditionalExport;

	/**
	 * Entry point for Bun runtime.
	 * @see https://bun.sh/docs/runtime/modules#resolution
	 */
	bun?: string | IConditionalExport;

	/**
	 * Entry point for Worker environments (Web Workers, Service Workers).
	 */
	worker?: string | IConditionalExport;

	/**
	 * Entry point for Electron main process.
	 */
	electron?: string | IConditionalExport;

	/**
	 * Entry point for React Native.
	 */
	'react-native'?: string | IConditionalExport;

	/**
	 * Entry point for development builds.
	 * Used by bundlers to provide development-specific code.
	 */
	development?: string | IConditionalExport;

	/**
	 * Entry point for production builds.
	 * Used by bundlers to provide production-optimized code.
	 */
	production?: string | IConditionalExport;

	/**
	 * Allows custom conditions.
	 */
	[condition: string]: string | IConditionalExport | undefined;
}

/**
 * Package exports map for the `exports` field.
 * Defines entry points of a package when imported by name.
 *
 * ```json
 * {
 *   "exports": {
 *     ".": "./index.js",
 *     "./feature": "./src/feature.js",
 *     "./package.json": "./package.json"
 *   }
 * }
 * ```
 * @see https://nodejs.org/api/packages.html#exports
 * @see https://nodejs.org/api/packages.html#subpath-exports
 */
export interface IExportsMap {
	/**
	 * Maps subpath patterns to file paths or conditional exports.
	 * Use `null` to restrict access to a subpath.
	 */
	[path: string]: string | IConditionalExport | null;
}

/**
 * Package imports map for the `imports` field.
 * Allows defining internal import aliases within the package.
 * All entries must start with `#`.
 *
 * ```json
 * {
 *   "imports": {
 *     "#utils": "./src/utils/index.js",
 *     "#internal/*": "./src/internal/*.js"
 *   }
 * }
 * ```
 * @see https://nodejs.org/api/packages.html#imports
 * @see https://nodejs.org/api/packages.html#subpath-imports
 */
export interface IImportsMap {
	[path: string]: string | IConditionalExport;
}

/**
 * Funding information for a package.
 * Provides details on how to financially support the package.
 *
 * ```json
 * {
 *   "funding": {
 *     "type": "opencollective",
 *     "url": "https://opencollective.com/webpack"
 *   }
 * }
 * ```
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#funding
 */
export interface IFunding {
	/**
	 * The type of funding (e.g., "opencollective", "github", "patreon").
	 */
	type?: string;

	/**
	 * The URL to the funding page.
	 */
	url: string;
}

/**
 * Metadata for a single peer dependency.
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependenciesmeta
 */
export interface IPeerDependencyMeta {
	/**
	 * Marks the peer dependency as optional.
	 * When true, npm will not automatically install this peer dependency.
	 */
	optional?: boolean;
}

/**
 * Metadata for peer dependencies.
 * Allows specifying additional information about peer dependencies,
 * such as marking them as optional.
 *
 * ```json
 * {
 *   "peerDependencies": {
 *     "react": "^18.0.0",
 *     "typescript": "^5.0.0"
 *   },
 *   "peerDependenciesMeta": {
 *     "typescript": {
 *       "optional": true
 *     }
 *   }
 * }
 * ```
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependenciesmeta
 */
export interface IPeerDependenciesMeta {
	[packageName: string]: IPeerDependencyMeta;
}

/**
 * TypeScript types version map.
 * Allows providing different type definitions for different TypeScript versions.
 *
 * ```json
 * {
 *   "typesVersions": {
 *     ">=4.0": {
 *       "*": ["ts4.0/*"]
 *     },
 *     ">=3.0": {
 *       "*": ["ts3.0/*"]
 *     }
 *   }
 * }
 * ```
 * @see https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions
 */
export interface ITypesVersions {
	[version: string]: {
		[path: string]: string[];
	};
}

/**
 * Workspaces configuration for monorepos.
 * Allows defining glob patterns for workspace packages.
 *
 * ```json
 * {
 *   "workspaces": {
 *     "packages": ["packages/*"],
 *     "nohoist": ["**\/react-native"]
 *   }
 * }
 * ```
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#workspaces
 * @see https://yarnpkg.com/features/workspaces
 */
export interface IWorkspaces {
	/**
	 * Glob patterns of workspace packages.
	 */
	packages?: string[];

	/**
	 * Packages that should not be hoisted to the root node_modules (Yarn only).
	 */
	nohoist?: string[];
}

/**
 * Dependency overrides configuration.
 * Allows overriding versions of nested dependencies.
 *
 * ```json
 * {
 *   "overrides": {
 *     "foo": "1.0.0",
 *     "bar": {
 *       "baz": "2.0.0"
 *     }
 *   }
 * }
 * ```
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides
 */
export interface IOverrides {
	[packageName: string]: string | IOverrides;
}

/**
 * A TypeScript definition for the package descriptor file.
 * @see http://wiki.commonjs.org/wiki/Packages/1.0
 * @see https://docs.npmjs.com/files/package.json
 * @see https://yarnpkg.com/en/docs/package-json
 */
export interface IPackageJson {
	[field: string]: any;

	/**
	 * Package author information. An author is one person.
	 * * Shorthand expression
	 * ```
	 * your-name <account@your-domain> (http://your-url)
	 * ```
	 * @see https://docs.npmjs.com/files/package.json#people-fields-author-contributors
	 * @see https://yarnpkg.com/en/docs/package-json#toc-author
	 */
	readonly author?: string | IAuthor;

	/**
	 * An executable file which will be installed into the PATH
	 * with a package install. `npm` will symlink that file into
	 * `prefix/bin` for global installs, or `./node_modules/.bin/`
	 * for local installs.
	 *
	 * ```json
	 * {
	 *   "bin" : {
	 *     "myapp" : "./cli.js"
	 *   }
	 * }
	 * ```
	 *
	 * For example, with linux if you install `myapp`,
	 * it'll create a symlink from the `cli.js` script
	 * to `/usr/local/bin/myapp`.
	 * @see https://docs.npmjs.com/files/package.json#bin
	 */
	readonly bin?: string | IBinMap;

	/**
	 * This is a hint to the module which is meant to be
	 * used "client-side" instead of "nodejs".
	 *
	 * Can be a string pointing to the browser entry point:
	 *
	 * ```json
	 * {
	 *   "browser": "./lib/browser.js"
	 * }
	 * ```
	 *
	 * Or an object mapping Node.js modules to browser alternatives:
	 *
	 * ```json
	 * {
	 *   "browser": {
	 *     "./lib/server.js": "./lib/browser.js",
	 *     "fs": false
	 *   }
	 * }
	 * ```
	 * @see https://github.com/defunctzombie/package-browser-field-spec
	 * @see http://2ality.com/2017/04/setting-up-multi-platform-packages.html#browser-browser-specific-code
	 */
	readonly browser?: string | IBrowserMap;

	/**
	 * The url to your project's issue tracker and (or) the email
	 * address to which issues should be reported. These are helpful
	 * for people who encounter issues with your package.
	 * @see https://docs.npmjs.com/files/package.json#bugs
	 * @see https://yarnpkg.com/en/docs/package-json#toc-bugs
	 */
	readonly bugs?: string | IBugs;

	/**
	 * Bundled dependencies are an array of package names that
	 * will be bundled together when publishing your package.
	 * @see https://docs.npmjs.com/files/package.json#bundleddependencies
	 * @see https://yarnpkg.com/en/docs/package-json#toc-bundleddependencies
	 */
	readonly bundledDependencies?: string[];

	/**
	 * Alias for `bundledDependencies`.
	 * Both spellings are supported by npm.
	 * @see https://docs.npmjs.com/files/package.json#bundleddependencies
	 */
	readonly bundleDependencies?: string[];

	/**
	 * A "`config`" object can be used to set configuration parameters
	 * used in package scripts that persist across upgrades.
	 * For instance, if a package had the following:
	 * ```json
	 * {
	 *   "config" : {
	 *     "port" : "8080"
	 *   }
	 * }
	 * ```
	 * and then had a "`start`" command that then referenced the
	 * npm_package_config_port environment variable,
	 * then the user could override that by doing npm config set foo:port 8001.
	 * @see https://docs.npmjs.com/files/package.json#config
	 * @see https://yarnpkg.com/en/docs/package-json#toc-config
	 */
	readonly config?: IConfig;

	/**
	 * If there is an `AUTHORS` file in the root of your package,
	 * npm will treat each line as a Name <email> (url) format,
	 * where email and url are optional. Lines which start with a # or are blank,
	 * will be ignored.
	 * @see https://docs.npmjs.com/files/package.json#people-fields-author-contributors
	 * @see https://yarnpkg.com/en/docs/package-json#toc-contributors
	 */
	readonly contributors?: Array<IAuthor | string>;

	/**
	 * If your code only runs on certain cpu architectures, you can specify which ones.
	 * This checks against `process.arch`.
	 * @see https://docs.npmjs.com/files/package.json#cpu
	 * @see https://yarnpkg.com/en/docs/package-json#toc-cpu
	 * @see https://nodejs.org/api/process.html#process_process_arch
	 */
	readonly cpu?: CPU[];

	/**
	 * Dependencies are specified in a simple object that maps a package name
	 * to a version range. The version range is a string which has one or
	 * more space-separated descriptors. Dependencies can also be
	 * identified with a tarball or git URL.
	 * @see http://wiki.commonjs.org/wiki/Packages/1.0
	 * @see https://docs.npmjs.com/files/package.json#dependencies
	 * @see https://yarnpkg.com/en/docs/package-json#toc-dependencies
	 */
	readonly dependencies?: IDependencyMap;

	/**
	 * A brief description of the package.
	 * By convention, the first sentence (up to the first ". ")
	 * should be usable as a package title in listings.
	 * @see https://docs.npmjs.com/files/package.json#description-1
	 * @see http://wiki.commonjs.org/wiki/Packages/1.0
	 * @see https://yarnpkg.com/en/docs/package-json#toc-description
	 */
	readonly description?: string;

	/**
	 * A deprecation message for the package.
	 * When set, npm will display a warning when the package is installed.
	 * This is typically set via `npm deprecate` command, but can also be
	 * set directly in package.json.
	 *
	 * ```json
	 * {
	 *   "deprecated": "This package is no longer maintained. Use 'new-package' instead."
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/commands/npm-deprecate
	 */
	readonly deprecated?: string;

	/**
	 * If someone is planning on downloading and using your module
	 * in their program, then they probably don't want or need
	 * to download and build the external test or documentation
	 * framework that you use. In this case, it's best to map
	 * these additional items in a devDependencies object.
	 * @see https://docs.npmjs.com/files/package.json#devdependencies
	 * @see https://yarnpkg.com/en/docs/package-json#toc-devdependencies
	 */
	readonly devDependencies?: IDependencyMap;

	/**
	 * You can specify exact locations to put binary files, man pages,
	 * documentation, examples, etc. Package manager tools must use
	 * these directory definitions to find various package components.
	 * ```
	 * {
	 *   "directories": {
	 *     "lib": "path/to/lib/",
	 *     "bin": "path/to/bin/",
	 *     "man": "path/to/man/",
	 *     "doc": "path/to/doc/",
	 *     "example": "path/to/example/"
	 *   }
	 * }
	 * ```
	 * @see http://wiki.commonjs.org/wiki/Packages/1.0
	 * @see https://docs.npmjs.com/files/package.json#directories
	 * @see https://yarnpkg.com/en/docs/package-json#toc-directories
	 */
	readonly directories?: IDirectories;

	/**
	 * You can specify the version of node that your stuff works on.
	 * You can also specify which versions of `npm` are capable
	 * of properly installing your program.
	 * @see https://docs.npmjs.com/files/package.json#engines
	 * @see https://yarnpkg.com/en/docs/package-json#toc-engines
	 */
	readonly engines?: IEngines;

	/**
	 * Development engine requirements.
	 * Similar to `engines`, but these requirements only apply during
	 * development (not when the package is used as a dependency).
	 *
	 * ```json
	 * {
	 *   "devEngines": {
	 *     "runtime": {
	 *       "name": "node",
	 *       "version": ">=20.0.0"
	 *     },
	 *     "packageManager": {
	 *       "name": "npm",
	 *       "version": ">=10.0.0"
	 *     }
	 *   }
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#devengines
	 */
	readonly devEngines?: IDevEngines;

	/**
	 * The `exports` field allows defining entry points of a package
	 * when imported by name. It takes precedence over the `main` field
	 * and allows restricting access to internal modules.
	 *
	 * ```json
	 * {
	 *   "exports": {
	 *     ".": {
	 *       "import": "./dist/esm/index.js",
	 *       "require": "./dist/cjs/index.js"
	 *     },
	 *     "./utils": "./dist/utils.js"
	 *   }
	 * }
	 * ```
	 * @see https://nodejs.org/api/packages.html#exports
	 * @see https://nodejs.org/api/packages.html#conditional-exports
	 */
	readonly exports?: string | string[] | IExportsMap | IConditionalExport | null;

	/**
	 * Files that are included in your project described
	 * as a glob pattern. Omitting the field will make it default
	 * to `["*"]`, as it will include all files.
	 * @see https://docs.npmjs.com/files/package.json#files
	 * @see https://yarnpkg.com/en/docs/package-json#toc-files
	 */
	readonly files?: string[];

	/**
	 * If your package only allows one version of a given dependency,
	 * and you'd like to enforce the same behavior as `yarn install --flat`
	 * on the command line, set this to true.
	 * @see https://yarnpkg.com/en/docs/package-json#toc-flat
	 */
	readonly flat?: boolean;

	/**
	 * Funding information for the package.
	 * Provides details on how to financially support the package maintainers.
	 *
	 * ```json
	 * {
	 *   "funding": {
	 *     "type": "github",
	 *     "url": "https://github.com/sponsors/user"
	 *   }
	 * }
	 * ```
	 *
	 * Can also be an array for multiple funding sources:
	 *
	 * ```json
	 * {
	 *   "funding": [
	 *     { "type": "github", "url": "https://github.com/sponsors/user" },
	 *     { "type": "opencollective", "url": "https://opencollective.com/project" }
	 *   ]
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#funding
	 */
	readonly funding?: string | IFunding | IFunding[];

	/**
	 * The url to the project homepage.
	 * @see https://docs.npmjs.com/files/package.json#homepage
	 * @see https://yarnpkg.com/en/docs/package-json#toc-homepage
	 */
	readonly homepage?: string;

	/**
	 * Package imports field for creating internal module aliases.
	 * Allows defining import paths that only work within the package itself.
	 * All entries must start with `#` to distinguish them from package specifiers.
	 *
	 * ```json
	 * {
	 *   "imports": {
	 *     "#utils": "./src/utils/index.js",
	 *     "#internal/*": "./src/internal/*.js"
	 *   }
	 * }
	 * ```
	 * @see https://nodejs.org/api/packages.html#imports
	 * @see https://nodejs.org/api/packages.html#subpath-imports
	 */
	readonly imports?: IImportsMap;

	/**
	 * Entry point for jsDelivr CDN.
	 * Specifies the file to serve when the package is loaded via jsDelivr.
	 *
	 * ```json
	 * {
	 *   "jsdelivr": "./dist/index.min.js"
	 * }
	 * ```
	 * @see https://www.jsdelivr.com/features
	 */
	readonly jsdelivr?: string;

	/**
	 * An array of string keywords to assist users searching for the package in catalogs.
	 * @see https://docs.npmjs.com/files/package.json#keywords
	 * @see https://yarnpkg.com/en/docs/package-json#toc-keywords
	 */
	readonly keywords?: string[];

	/**
	 * If your code only runs with certain C library implementations,
	 * you can specify which ones. This checks against the C library
	 * used by the Node.js runtime.
	 *
	 * ```json
	 * {
	 *   "libc": ["glibc"]
	 * }
	 * ```
	 *
	 * You can also exclude certain implementations:
	 *
	 * ```json
	 * {
	 *   "libc": ["!musl"]
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#libc
	 */
	readonly libc?: Libc[];

	/**
	 * A license for your package so that people know how they are permitted
	 * to use it, and any restrictions you're placing on it.
	 * If you're using a common license such as `BSD-2-Clause` or `MIT`,
	 * add a current {@link https://spdx.org/licenses/ | SPDX license identifier}.
	 * @see https://docs.npmjs.com/files/package.json#license
	 * @see https://yarnpkg.com/en/docs/package-json#toc-license
	 * @see https://spdx.org/licenses/
	 * @see https://help.github.com/en/articles/licensing-a-repository
	 */
	readonly license?: SPDXLicenseID | SPDXLicenseIDApproved;

	/**
	 * The main field is a module ID that is the primary entry point to your package.
	 * That is, if your package is named `foo`, and a user installs it, and then
	 * does `require("foo")`, then your main module's exports object will be returned.
	 * This should be a module ID relative to the root of your package folder.
	 * For most modules, it makes the most sense to have a main script and often not much else.
	 * @see https://docs.npmjs.com/files/package.json#main
	 * @see https://yarnpkg.com/en/docs/package-json#toc-main
	 */
	readonly main?: string;

	/**
	 * A single file (or an array of filenames) for the man program.
	 * @see https://docs.npmjs.com/files/package.json#man
	 */
	readonly man?: string | string[];

	/**
	 * A list of people who maintain this package.
	 * This field is managed by npm and may not be directly edited.
	 * It's populated from the npm registry.
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#people-fields-author-contributors
	 */
	readonly maintainers?: Array<IAuthor | string>;

	/**
	 * The `module` field is used by bundlers like webpack and Rollup
	 * to detect the ES module entry point of a package.
	 * This is an unofficial field but widely adopted by the ecosystem.
	 *
	 * ```json
	 * {
	 *   "main": "./dist/cjs/index.js",
	 *   "module": "./dist/esm/index.js"
	 * }
	 * ```
	 * @see https://github.com/rollup/rollup/wiki/pkg.module
	 * @see https://webpack.js.org/guides/author-libraries/#final-steps
	 */
	readonly module?: string;

	/**
	 * The name of your package.
	 * The name and version together should form a unique identifier accoss a project.
	 * The name and version fields are optional if you don't want to publish your package.
	 * A name can be optionally prefixed by a scope, e.g. `@types/lodash`.
	 * @see https://docs.npmjs.com/files/package.json#name
	 * @see https://yarnpkg.com/en/docs/package-json#toc-name
	 */
	readonly name?: string;

	/**
	 * If a dependency can be used, but you would like npm to proceed
	 * if it cannot be found or fails to install, then you may put it
	 * in the `optionalDependencies` object. This is a map of package name
	 * to version or url, just like the `dependencies` object.
	 * The difference is that build failures do not cause installation to fail.
	 * It is still your program's responsibility to handle the lack of the dependency.
	 * @see https://docs.npmjs.com/files/package.json#optionaldependencies
	 * @see https://yarnpkg.com/en/docs/package-json#toc-optionaldependencies
	 */
	readonly optionalDependencies?: IDependencyMap;

	/**
	 * Allows overriding versions of nested dependencies.
	 * This is useful when you need to fix a security vulnerability
	 * or bug in a transitive dependency without waiting for the
	 * direct dependency to update.
	 *
	 * ```json
	 * {
	 *   "overrides": {
	 *     "foo": "1.0.0",
	 *     "bar": {
	 *       "baz": "2.0.0"
	 *     }
	 *   }
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides
	 */
	readonly overrides?: IOverrides;

	/**
	 * You can specify which operating systems your module will run on
	 * @see https://docs.npmjs.com/files/package.json#os
	 * @see https://yarnpkg.com/en/docs/package-json#toc-os
	 * @see https://nodejs.org/api/process.html#process_process_platform
	 */
	readonly os?: OS[];

	/**
	 * Defines which package manager is expected to be used when working
	 * on the current project. This field is managed by Corepack.
	 * Setting this field causes Corepack to ensure the specified package
	 * manager version is available and to run it transparently.
	 *
	 * ```json
	 * {
	 *   "packageManager": "npm@10.2.0"
	 * }
	 * ```
	 *
	 * Or with yarn or pnpm:
	 *
	 * ```json
	 * {
	 *   "packageManager": "pnpm@8.10.0"
	 * }
	 * ```
	 * @see https://nodejs.org/api/corepack.html
	 * @see https://nodejs.org/api/packages.html#packagemanager
	 */
	readonly packageManager?: string;

	/**
	 * In some cases, you want to express the compatibility of your package
	 * with a host tool or library, while not necessarily doing a require
	 * of this host. This is usually referred to as a plugin. Notably,
	 * your module may be exposing a specific interface, expected
	 * and specified by the host documentation.
	 * @see https://docs.npmjs.com/files/package.json#peerdependencies
	 * @see https://yarnpkg.com/en/docs/package-json#toc-peerdependencies
	 */
	readonly peerDependencies?: IDependencyMap;

	/**
	 * Provides metadata about peer dependencies, such as marking them as optional.
	 * When a peer dependency is marked as optional, npm will not automatically
	 * install it and will not emit a warning if it's missing.
	 *
	 * ```json
	 * {
	 *   "peerDependencies": {
	 *     "react": "^18.0.0",
	 *     "typescript": "^5.0.0"
	 *   },
	 *   "peerDependenciesMeta": {
	 *     "typescript": {
	 *       "optional": true
	 *     }
	 *   }
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependenciesmeta
	 */
	readonly peerDependenciesMeta?: IPeerDependenciesMeta;

	/**
	 * This option used to trigger an npm warning, but it will no longer warn.
	 * It is purely there for informational purposes. It is now recommended
	 * that you install any binaries as local `devDependencies` wherever possible.
	 * @deprecated
	 */
	readonly preferGlobal?: boolean;

	/**
	 * If you set "`private`": true in your `package.json`, then `npm` will refuse to publish it.
	 * This is a way to prevent accidental publication of private repositories.
	 * If you would like to ensure that a given package is only ever published to
	 * a specific registry (for example, an internal registry),
	 * then use the [[publishConfig]] dictionary described below to override
	 * the registry config param at publish-time.
	 * @see https://docs.npmjs.com/files/package.json#private
	 * @see https://yarnpkg.com/en/docs/package-json#toc-private
	 */
	readonly private?: boolean;

	/**
	 * This is a set of config values that will be used at publish-time.
	 * It's especially handy if you want to set the `tag`, `registry` or `access`,
	 * so that you can ensure that a given package is not tagged with `“latest”`,
	 * published to the global public registry or that a scoped module is private by default.
	 * Any config values can be overridden, but only "`tag`", "`registry`" and
	 * "`access`" probably matter for the purposes of publishing.
	 * See npm-config to see the list of config options that can be overridden.
	 * * Public Registry
	 *
	 * ```json
	 * {
	 *   "publishConfig":{
	 *     "registry":"https://registry.npmjs.org"
	 *   }
	 * }
	 * ```
	 *
	 * * Your Private Registry
	 *
	 * ```json
	 * {
	 *   "publishConfig":{
	 *     "registry":"http://your-registry.local"
	 *   }
	 * }
	 * ```
	 *
	 * @see https://docs.npmjs.com/files/package.json#publishconfig
	 * @see https://yarnpkg.com/en/docs/package-json#toc-publishconfig
	 */
	readonly publishConfig?: IPublishConfig;

	/**
	 * Specify the place where your code lives.
	 * This is helpful for people who want to contribute.
	 *
	 * * Git
	 *
	 * ```json
	 * {
	 *   "repository": {
	 *     "type": "git",
	 *     "url": "https://github.com/ajaxlab/package-json-type.git"
	 *   }
	 * }
	 * ```
	 *
	 * * Svn
	 *
	 * ```json
	 * {
	 *   "repository": {
	 *     "type": "svn",
	 *     "url": "https://v8.googlecode.com/svn/trunk/"
	 *   }
	 * }
	 * ```
	 *
	 * * Monorepo
	 *
	 * ```json
	 * {
	 *   "repository": {
	 *     "type": "git",
	 *     "url": "https://github.com/facebook/react.git",
	 *     "directory": "packages/react-dom"
	 *   }
	 * }
	 * ```
	 * @see https://yarnpkg.com/en/docs/package-json#toc-repository
	 * @see https://docs.npmjs.com/files/package.json#repository
	 */
	readonly repository?: string | IRepository;

	/**
	 * Allows you to override a version of a particular nested dependency.
	 * See the Selective Versions Resolutions RFC for the full spec.
	 * Note that installing dependencies via `[yarn install --flat]` will
	 * automatically add a resolutions block to your package.json file.
	 * @see https://yarnpkg.com/en/docs/package-json#toc-resolutions
	 */
	readonly resolutions?: {
		[dependencyName: string]: string;
	};

	/**
	 * The "`scripts`" property is a dictionary containing script commands
	 * that are run at various times in the lifecycle of your package.
	 * The key is the lifecycle event, and the value is the command to run at that point.
	 * ```json
	 * {
	 *   "scripts": {
	 *     "install": "install.js",
	 *     "uninstall": "uninstall.js",
	 *     "build": "build.js",
	 *     "doc": "make-doc.js",
	 *     "test": "test.js",
	 *   }
	 * }
	 * ```
	 */
	readonly scripts?:
		| IScriptsMap
		| {
				[scriptName: string]: string;
		  };

	/**
	 * Indicates whether the package has side effects for tree-shaking purposes.
	 * When set to `false`, bundlers like webpack can safely remove
	 * unused exports from the bundle.
	 *
	 * ```json
	 * {
	 *   "sideEffects": false
	 * }
	 * ```
	 *
	 * Can also be an array of files that have side effects:
	 *
	 * ```json
	 * {
	 *   "sideEffects": [
	 *     "./src/polyfills.js",
	 *     "*.css"
	 *   ]
	 * }
	 * ```
	 * @see https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free
	 */
	readonly sideEffects?: boolean | string[];

	/**
	 * Defines the module format for `.js` files in the package scope.
	 * When set to `"module"`, `.js` files are treated as ES modules.
	 * When set to `"commonjs"` (default), `.js` files are treated as CommonJS.
	 *
	 * ```json
	 * {
	 *   "type": "module"
	 * }
	 * ```
	 * @see https://nodejs.org/api/packages.html#type
	 */
	readonly type?: 'module' | 'commonjs';

	/**
	 * Indicate the main declaration file in your package.json.
	 * Set the `types` property to point to your bundled declaration file.
	 * ```json
	 * {
	 *   "name": "some-package",
	 *   "version": "1.0.0",
	 *   "main": "./lib/main.js",
	 *   "types": "./lib/main.d.ts"
	 * }
	 * ```
	 * @see https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
	 */
	readonly types?: string;

	/**
	 * Alias for `types`. Used to indicate the main TypeScript declaration file.
	 * This is the older name for the field, but is still widely supported.
	 * @see https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
	 */
	readonly typings?: string;

	/**
	 * Allows providing different type definitions for different TypeScript versions.
	 * This is useful when your package uses features that are only available
	 * in newer TypeScript versions.
	 *
	 * ```json
	 * {
	 *   "typesVersions": {
	 *     ">=4.0": {
	 *       "*": ["ts4.0/*"]
	 *     },
	 *     ">=3.0": {
	 *       "*": ["ts3.0/*"]
	 *     }
	 *   }
	 * }
	 * ```
	 * @see https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions
	 */
	readonly typesVersions?: ITypesVersions;

	/**
	 * Entry point for unpkg CDN.
	 * Specifies the file to serve when the package is loaded via unpkg.
	 *
	 * ```json
	 * {
	 *   "unpkg": "./dist/index.umd.min.js"
	 * }
	 * ```
	 * @see https://unpkg.com/
	 */
	readonly unpkg?: string;

	/**
	 * A version string conforming to the Semantic Versioning requirements.
	 * @see https://docs.npmjs.com/files/package.json#version
	 * @see https://yarnpkg.com/en/docs/package-json#toc-version
	 */
	readonly version?: string;

	/**
	 * Workspaces allow you to manage multiple packages within
	 * a single repository (monorepo). Define the workspace packages
	 * using glob patterns.
	 *
	 * ```json
	 * {
	 *   "workspaces": [
	 *     "packages/*",
	 *     "apps/*"
	 *   ]
	 * }
	 * ```
	 *
	 * Can also be an object with more options:
	 *
	 * ```json
	 * {
	 *   "workspaces": {
	 *     "packages": ["packages/*"],
	 *     "nohoist": ["**\/react-native"]
	 *   }
	 * }
	 * ```
	 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#workspaces
	 * @see https://yarnpkg.com/features/workspaces
	 */
	readonly workspaces?: string[] | IWorkspaces;
}

/**
 * This is a set of config values that will be used at publish-time.
 * It's especially handy if you want to set the `tag`, `registry` or `access`,
 * so that you can ensure that a given package is not tagged with `“latest”`,
 * published to the global public registry or that a scoped module is private by default.
 * Any config values can be overridden, but only "`tag`", "`registry`" and
 * "`access`" probably matter for the purposes of publishing.
 * See npm-config to see the list of config options that can be overridden.
 * * Public Registry
 *
 * ```json
 * {
 *   "publishConfig":{
 *     "registry":"https://registry.npmjs.org"
 *   }
 * }
 * ```
 *
 * * Your Private Registry
 *
 * ```json
 * {
 *   "publishConfig":{
 *     "registry":"http://your-registry.local"
 *   }
 * }
 * ```
 *
 * @see https://docs.npmjs.com/files/package.json#publishconfig
 * @see https://yarnpkg.com/en/docs/package-json#toc-publishconfig
 */
export interface IPublishConfig {
	/**
	 * Access level for scoped packages: "public" or "restricted".
	 */
	access?: 'public' | 'restricted';

	/**
	 * The npm registry URL to publish to.
	 */
	registry?: string;

	/**
	 * The distribution tag to publish to.
	 */
	tag?: string;

	/**
	 * The subdirectory to publish. Useful for monorepos where
	 * the build output is in a subdirectory.
	 */
	directory?: string;

	/**
	 * Files to mark as executable after extraction.
	 * Only relevant for pnpm.
	 */
	executableFiles?: string[];

	/**
	 * When set to true, the local package will be linked
	 * to the virtual store instead of being copied.
	 * Only relevant for pnpm.
	 */
	linkDirectory?: boolean;

	/**
	 * Override the main entry point for publishing.
	 */
	main?: string;

	/**
	 * Override the module entry point for publishing.
	 */
	module?: string;

	/**
	 * Override the types entry point for publishing.
	 */
	types?: string;

	/**
	 * Override the exports field for publishing.
	 */
	exports?: string | IExportsMap | IConditionalExport | null;

	/**
	 * Override the bin field for publishing.
	 */
	bin?: string | IBinMap;

	/**
	 * Override the browser field for publishing.
	 */
	browser?: string | IBrowserMap;

	/**
	 * Provenance attestation for the package.
	 * When true, npm generates and publishes provenance statements.
	 */
	provenance?: boolean;
}

/**
 * Specify the place where your code lives.
 * This is helpful for people who want to contribute.
 *
 * * Git
 *
 * ```json
 * {
 *   "repository": {
 *     "type": "git",
 *     "url": "https://github.com/ajaxlab/package-json-type.git"
 *   }
 * }
 * ```
 *
 * * Svn
 *
 * ```json
 * {
 *   "repository": {
 *     "type": "svn",
 *     "url": "https://v8.googlecode.com/svn/trunk/"
 *   }
 * }
 * ```
 *
 * * Monorepo
 *
 * ```json
 * {
 *   "repository": {
 *     "type": "git",
 *     "url": "https://github.com/facebook/react.git",
 *     "directory": "packages/react-dom"
 *   }
 * }
 * ```
 * @see https://yarnpkg.com/en/docs/package-json#toc-repository
 * @see https://docs.npmjs.com/files/package.json#repository
 */
export interface IRepository {
	directory?: string;
	type: string;
	url: string;
}

/**
 * The "`scripts`" property is a dictionary containing script commands
 * that are run at various times in the lifecycle of your package.
 * The key is the lifecycle event, and the value is the command to run at that point.
 * ```json
 * {
 *   "scripts": {
 *     "install": "install.js",
 *     "uninstall": "uninstall.js",
 *     "build": "build.js",
 *     "doc": "make-doc.js",
 *     "test": "test.js",
 *   }
 * }
 * ```
 * @see https://docs.npmjs.com/misc/scripts
 * @see https://yarnpkg.com/en/docs/package-json#toc-scripts
 */
export interface IScriptsMap {
	install: string;
	postinstall: string;
	postpack: string;
	postrestart: string;
	postshrinkwrap: string;
	poststart: string;
	poststop: string;
	posttest: string;
	postuninstall: string;
	postversion: string;
	preinstall: string;
	prepack: string;
	prepare: string;
	prepublish: string;
	prepublishOnly: string;
	prerestart: string;
	preshrinkwrap: string;
	prestart: string;
	prestop: string;
	pretest: string;
	preuninstall: string;
	preversion: string;
	publish: string;
	restart: string;
	shrinkwrap: string;
	start: string;
	stop: string;
	test: string;
	uninstall: string;
	version: string;
}

/**
 * CPU architectures supported by Node.js.
 * It checks against `process.arch`.
 * @see https://docs.npmjs.com/files/package.json#cpu
 * @see https://yarnpkg.com/en/docs/package-json#toc-cpu
 * @see https://nodejs.org/api/process.html#process_process_arch
 */
export type CPU =
	| 'arm'
	| 'arm64'
	| 'ia32'
	| 'loong64'
	| 'mips'
	| 'mipsel'
	| 'ppc'
	| 'ppc64'
	| 'riscv64'
	| 's390'
	| 's390x'
	| 'x32'
	| 'x64';

/**
 * Operating systems supported by Node.js.
 * You can specify which operating systems your module will run on.
 * @see https://docs.npmjs.com/files/package.json#os
 * @see https://yarnpkg.com/en/docs/package-json#toc-os
 * @see https://nodejs.org/api/process.html#process_process_platform
 */
export type OS =
	| 'aix'
	| 'android'
	| 'cygwin'
	| 'darwin'
	| 'freebsd'
	| 'haiku'
	| 'linux'
	| 'netbsd'
	| 'openbsd'
	| 'sunos'
	| 'win32';

/**
 * C library types for native module compatibility.
 * Used in the `libc` field to specify which C library the package is compatible with.
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#libc
 */
export type Libc = 'glibc' | 'musl';

/**
 * SPDX License IDs which are not OSI approved.
 * @see https://spdx.org/licenses/
 */
export type SPDXLicenseID =
	| 'Abstyles'
	| 'Adobe-2006'
	| 'Adobe-Glyph'
	| 'ADSL'
	| 'Afmparse'
	| 'AGPL-1.0-only'
	| 'AGPL-1.0-or-later'
	| 'Aladdin'
	| 'AMDPLPA'
	| 'AML'
	| 'AMPAS'
	| 'ANTLR-PD'
	| 'Apache-1.0'
	| 'APAFML'
	| 'Bahyph'
	| 'Barr'
	| 'Beerware'
	| 'BitTorrent-1.0'
	| 'BitTorrent-1.1'
	| 'Borceux'
	| 'BSD-1-Clause'
	| 'BSD-2-Clause-FreeBSD'
	| 'BSD-2-Clause-NetBSD'
	| 'BSD-3-Clause-Attribution'
	| 'BSD-3-Clause-Clear'
	| 'BSD-3-Clause-LBNL'
	| 'BSD-3-Clause-No-Nuclear-License'
	| 'BSD-3-Clause-No-Nuclear-License-2014'
	| 'BSD-3-Clause-No-Nuclear-Warranty'
	| 'BSD-4-Clause'
	| 'BSD-4-Clause-UC'
	| 'BSD-Protection'
	| 'BSD-Source-Code'
	| 'bzip2-1.0.5'
	| 'bzip2-1.0.6'
	| 'Caldera'
	| 'CC-BY-1.0'
	| 'CC-BY-2.0'
	| 'CC-BY-2.5'
	| 'CC-BY-3.0'
	| 'CC-BY-4.0'
	| 'CC-BY-NC-1.0'
	| 'CC-BY-NC-2.0'
	| 'CC-BY-NC-2.5'
	| 'CC-BY-NC-3.0'
	| 'CC-BY-NC-4.0'
	| 'CC-BY-NC-ND-1.0'
	| 'CC-BY-NC-ND-2.0'
	| 'CC-BY-NC-ND-2.5'
	| 'CC-BY-NC-ND-3.0'
	| 'CC-BY-NC-ND-4.0'
	| 'CC-BY-NC-SA-1.0'
	| 'CC-BY-NC-SA-2.0'
	| 'CC-BY-NC-SA-2.5'
	| 'CC-BY-NC-SA-3.0'
	| 'CC-BY-NC-SA-4.0'
	| 'CC-BY-ND-1.0'
	| 'CC-BY-ND-2.0'
	| 'CC-BY-ND-2.5'
	| 'CC-BY-ND-3.0'
	| 'CC-BY-ND-4.0'
	| 'CC-BY-SA-1.0'
	| 'CC-BY-SA-2.0'
	| 'CC-BY-SA-2.5'
	| 'CC-BY-SA-3.0'
	| 'CC-BY-SA-4.0'
	| 'CC0-1.0'
	| 'CDDL-1.1'
	| 'CDLA-Permissive-1.0'
	| 'CDLA-Sharing-1.0'
	| 'CECILL-1.0'
	| 'CECILL-1.1'
	| 'CECILL-2.0'
	| 'CECILL-B'
	| 'CECILL-C'
	| 'CERN-OHL-1.1'
	| 'CERN-OHL-1.2'
	| 'ClArtistic'
	| 'CNRI-Jython'
	| 'CNRI-Python-GPL-Compatible'
	| 'Condor-1.1'
	| 'copyleft-next-0.3.0'
	| 'copyleft-next-0.3.1'
	| 'CPOL-1.02'
	| 'Crossword'
	| 'CrystalStacker'
	| 'Cube'
	| 'curl'
	| 'D-FSL-1.0'
	| 'diffmark'
	| 'DOC'
	| 'Dotseqn'
	| 'DSDP'
	| 'dvipdfm'
	| 'eGenix'
	| 'ErlPL-1.1'
	| 'EUPL-1.0'
	| 'Eurosym'
	| 'FreeImage'
	| 'FSFAP'
	| 'FSFUL'
	| 'FSFULLR'
	| 'FTL'
	| 'GFDL-1.1-only'
	| 'GFDL-1.1-or-later'
	| 'GFDL-1.2-only'
	| 'GFDL-1.2-or-later'
	| 'GFDL-1.3-only'
	| 'GFDL-1.3-or-later'
	| 'Giftware'
	| 'GL2PS'
	| 'Glide'
	| 'Glulxe'
	| 'gnuplot'
	| 'GPL-1.0-only'
	| 'GPL-1.0-or-later'
	| 'gSOAP-1.3b'
	| 'HaskellReport'
	| 'HPND-sell-variant'
	| 'IBM-pibs'
	| 'ICU'
	| 'IJG'
	| 'ImageMagick'
	| 'iMatix'
	| 'Imlib2'
	| 'Info-ZIP'
	| 'Intel-ACPI'
	| 'Interbase-1.0'
	| 'JasPer-2.0'
	| 'JPNIC'
	| 'JSON'
	| 'LAL-1.2'
	| 'LAL-1.3'
	| 'Latex2e'
	| 'Leptonica'
	| 'LGPLLR'
	| 'Libpng'
	| 'libpng-2.0'
	| 'libtiff'
	| 'Linux-OpenIB'
	| 'LPPL-1.0'
	| 'LPPL-1.1'
	| 'LPPL-1.2'
	| 'LPPL-1.3a'
	| 'MakeIndex'
	| 'MIT-advertising'
	| 'MIT-CMU'
	| 'MIT-enna'
	| 'MIT-feh'
	| 'MITNFA'
	| 'mpich2'
	| 'MTLL'
	| 'Mup'
	| 'NBPL-1.0'
	| 'Net-SNMP'
	| 'NetCDF'
	| 'Newsletr'
	| 'NLOD-1.0'
	| 'NLPL'
	| 'NOSL'
	| 'Noweb'
	| 'NPL-1.0'
	| 'NPL-1.1'
	| 'NRL'
	| 'OCCT-PL'
	| 'ODbL-1.0'
	| 'ODC-By-1.0'
	| 'OFL-1.0'
	| 'OGL-UK-1.0'
	| 'OGL-UK-2.0'
	| 'OGL-UK-3.0'
	| 'OLDAP-1.1'
	| 'OLDAP-1.2'
	| 'OLDAP-1.3'
	| 'OLDAP-1.4'
	| 'OLDAP-2.0'
	| 'OLDAP-2.0.1'
	| 'OLDAP-2.1'
	| 'OLDAP-2.2'
	| 'OLDAP-2.2.1'
	| 'OLDAP-2.2.2'
	| 'OLDAP-2.3'
	| 'OLDAP-2.4'
	| 'OLDAP-2.5'
	| 'OLDAP-2.6'
	| 'OLDAP-2.7'
	| 'OLDAP-2.8'
	| 'OML'
	| 'OpenSSL'
	| 'OPL-1.0'
	| 'OSL-1.1'
	| 'PDDL-1.0'
	| 'PHP-3.01'
	| 'Plexus'
	| 'psfrag'
	| 'psutils'
	| 'Qhull'
	| 'Rdisc'
	| 'RHeCos-1.1'
	| 'RSA-MD'
	| 'Ruby'
	| 'SAX-PD'
	| 'Saxpath'
	| 'SCEA'
	| 'Sendmail'
	| 'Sendmail-8.23'
	| 'SGI-B-1.0'
	| 'SGI-B-1.1'
	| 'SGI-B-2.0'
	| 'SISSL-1.2'
	| 'SMLNJ'
	| 'SMPPL'
	| 'SNIA'
	| 'Spencer-86'
	| 'Spencer-94'
	| 'Spencer-99'
	| 'SugarCRM-1.1.3'
	| 'SWL'
	| 'TAPR-OHL-1.0'
	| 'TCL'
	| 'TCP-wrappers'
	| 'TMate'
	| 'TORQUE-1.1'
	| 'TOSL'
	| 'TU-Berlin-1.0'
	| 'TU-Berlin-2.0'
	| 'Unicode-DFS-2015'
	| 'Unicode-DFS-2016'
	| 'Unicode-TOU'
	| 'Unlicense'
	| 'Vim'
	| 'VOSTROM'
	| 'W3C-19980720'
	| 'W3C-20150513'
	| 'Wsuipa'
	| 'WTFPL'
	| 'X11'
	| 'Xerox'
	| 'XFree86-1.1'
	| 'xinetd'
	| 'xpp'
	| 'XSkat'
	| 'YPL-1.0'
	| 'YPL-1.1'
	| 'Zed'
	| 'Zend-2.0'
	| 'Zimbra-1.3'
	| 'Zimbra-1.4'
	| 'zlib-acknowledgement'
	| 'ZPL-1.1'
	| 'ZPL-2.1';

/**
 * SPDX License IDs which are approved by OSI.
 * @see https://spdx.org/licenses/
 */
export type SPDXLicenseIDApproved =
	| '0BSD'
	| 'AAL'
	| 'AFL-1.1'
	| 'AFL-1.2'
	| 'AFL-2.0'
	| 'AFL-2.1'
	| 'AFL-3.0'
	| 'AGPL-3.0-only'
	| 'AGPL-3.0-or-later'
	| 'Apache-1.1'
	| 'Apache-2.0'
	| 'APL-1.0'
	| 'APSL-1.0'
	| 'APSL-1.1'
	| 'APSL-1.2'
	| 'APSL-2.0'
	| 'Artistic-1.0'
	| 'Artistic-1.0-cl8'
	| 'Artistic-1.0-Perl'
	| 'Artistic-2.0'
	| 'BSD-2-Clause'
	| 'BSD-2-Clause-Patent'
	| 'BSD-3-Clause'
	| 'BSL-1.0'
	| 'CATOSL-1.1'
	| 'CDDL-1.0'
	| 'CECILL-2.1'
	| 'CNRI-Python'
	| 'CPAL-1.0'
	| 'CPL-1.0'
	| 'CUA-OPL-1.0'
	| 'ECL-1.0'
	| 'ECL-2.0'
	| 'EFL-1.0'
	| 'EFL-2.0'
	| 'Entessa'
	| 'EPL-1.0'
	| 'EPL-2.0'
	| 'EUDatagrid'
	| 'EUPL-1.1'
	| 'EUPL-1.2'
	| 'Fair'
	| 'Frameworx-1.0'
	| 'GPL-2.0-only'
	| 'GPL-2.0-or-later'
	| 'GPL-3.0-only'
	| 'GPL-3.0-or-later'
	| 'HPND'
	| 'Intel'
	| 'IPA'
	| 'IPL-1.0'
	| 'ISC'
	| 'LGPL-2.0-only'
	| 'LGPL-2.0-or-later'
	| 'LGPL-2.1-only'
	| 'LGPL-2.1-or-later'
	| 'LGPL-3.0-only'
	| 'LGPL-3.0-or-later'
	| 'LiLiQ-P-1.1'
	| 'LiLiQ-R-1.1'
	| 'LiLiQ-Rplus-1.1'
	| 'LPL-1.0'
	| 'LPL-1.02'
	| 'LPPL-1.3c'
	| 'MirOS'
	| 'MIT'
	| 'MIT-0'
	| 'Motosoto'
	| 'MPL-1.0'
	| 'MPL-1.1'
	| 'MPL-2.0'
	| 'MPL-2.0-no-copyleft-exception'
	| 'MS-PL'
	| 'MS-RL'
	| 'Multics'
	| 'NASA-1.3'
	| 'Naumen'
	| 'NCSA'
	| 'NGPL'
	| 'Nokia'
	| 'NPOSL-3.0'
	| 'NTP'
	| 'OCLC-2.0'
	| 'OFL-1.1'
	| 'OGTSL'
	| 'OSET-PL-2.1'
	| 'OSL-1.0'
	| 'OSL-2.0'
	| 'OSL-2.1'
	| 'OSL-3.0'
	| 'PHP-3.0'
	| 'PostgreSQL'
	| 'Python-2.0'
	| 'QPL-1.0'
	| 'RPL-1.1'
	| 'RPL-1.5'
	| 'RPSL-1.0'
	| 'RSCPL'
	| 'SimPL-2.0'
	| 'SISSL'
	| 'Sleepycat'
	| 'SPL-1.0'
	| 'UPL-1.0'
	| 'VSL-1.0'
	| 'W3C'
	| 'Watcom-1.0'
	| 'Xnet'
	| 'Zlib'
	| 'ZPL-2.0';
