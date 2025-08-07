#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';
import glob from 'fast-glob';
import { dim, gray, green, red, yellow } from 'kleur/colors';

const isCI = !!process.env.CI;
const defaultTimeout = isCI ? 1400000 : 600000;

/** @type {import('esbuild').BuildOptions} */
const defaultConfig = {
	minify: false,
	format: 'esm',
	platform: 'node',
	target: 'node18',
	sourcemap: false,
	sourcesContent: false,
	loader: {
		'.astro': 'copy',
		'.d.ts': 'copy',
		'.json': 'copy',
		'.gif': 'copy',
		'.jpeg': 'copy',
		'.jpg': 'copy',
		'.png': 'copy',
		'.tiff': 'copy',
		'.webp': 'copy',
		'.avif': 'copy',
		'.svg': 'copy',
		'.woff2': 'copy',
		'.woff': 'copy',
		'.ttf': 'copy',
		'.eot': 'copy',
		'.otf': 'copy',
	},
};

const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

const dtsGen = (buildTsConfig, outdir) => ({
	name: 'TypeScriptDeclarationsPlugin',
	setup(build) {
		build.onEnd((result) => {
			if (result.errors.length > 0) return;
			const date = dt.format(new Date());
			console.log(`${dim(`[${date}]`)} Generating TypeScript declarations...`);
			try {
				const res = execSync(`tsc --emitDeclarationOnly -p ${buildTsConfig} --outDir ./${outdir}`);
				console.log(res.toString());
				console.log(dim(`[${date}] `) + green('√ Generated TypeScript declarations'));
			} catch (error) {
				console.error(dim(`[${date}] `) + red(`${error}\n\n${error.stdout.toString()}`));
			}
		});
	},
});

async function clean(outdir, date, skip = []) {
	const files = await glob([`${outdir}/**`, ...skip], { filesOnly: true });
	console.log(dim(`[${date}] `) + dim(`Cleaning ${files.length} files from ${outdir}`));
	await Promise.all(files.map((file) => fs.rm(file, { force: true })));
}

async function readPackageJSON(path) {
	try {
		const content = await fs.readFile(path, { encoding: 'utf8' });
		try {
			return JSON.parse(content);
		} catch (parseError) {
			throw new Error(`Invalid JSON in ${path}: ${parseError.message}`);
		}
	} catch (readError) {
		throw new Error(`Failed to read ${path}: ${readError.message}`);
	}
}

/**
 * Run the dev or build command with the provided arguments.
 * @param {string} cmd - The command to run ('dev' or 'build').
 * @param {string[]} args - The arguments to pass to the command.
 * @returns {Promise<void>}
 */
async function devAndBuild(cmd, args) {
	const config = Object.assign({}, defaultConfig);
	const patterns = args
		.filter((f) => !!f) // remove empty args
		.map((f) => f.replace(/^'/, '').replace(/'$/, '')); // Needed for Windows: glob strings contain surrounding string chars??? remove these
	const entryPoints = [].concat(
		...(await Promise.all(
			patterns.map((pattern) => glob(pattern, { filesOnly: true, absolute: true }))
		))
	);
	const date = dt.format(new Date());

	const noClean = args.includes('--no-clean-dist');
	const bundle = args.includes('--bundle');
	const forceCJS = args.includes('--force-cjs');
	const buildTsConfig =
		args.find((arg) => arg.startsWith('--tsconfig='))?.split('=')[1] || 'tsconfig.json';
	const outdir = args.find((arg) => arg.startsWith('--outdir='))?.split('=')[1] || 'dist';

	const { type = 'module', dependencies = {} } = await readPackageJSON('./package.json');

	const format = type === 'module' && !forceCJS ? 'esm' : 'cjs';

	switch (cmd) {
		case 'dev': {
			if (!noClean) {
				console.log(
					`${dim(`[${date}]`)} Cleaning ${outdir} directory... ${dim(`(${entryPoints.length} files found)`)}`
				);
				await clean(outdir, date, [`!${outdir}/**/*.d.ts`]);
			}

			const rebuildPlugin = {
				name: 'dev:rebuild',
				setup(build) {
					build.onEnd(async (result) => {
						const date = dt.format(new Date());
						if (result?.errors.length) {
							const errMsg = result.errors.join('\n');
							console.error(dim(`[${date}] `) + red(errMsg));
						} else {
							if (result.warnings.length) {
								console.info(
									dim(`[${date}] `) +
									yellow(`! updated with warnings:\n${result.warnings.join('\n')}`)
								);
							}
							console.info(dim(`[${date}] `) + green('√ updated'));
						}
					});
				},
			};

			const builder = await esbuild.context({
				...config,
				entryPoints,
				outdir,
				format,
				sourcemap: 'linked',
				plugins: [rebuildPlugin],
			});

			console.log(
				`${dim(`[${date}] `) + gray('Watching for changes...')} ${dim(`(${entryPoints.length} files found)`)}`
			);
			await builder.watch();

			process.on('beforeExit', () => {
				builder.stop?.();
			});
			break;
		}
		case 'build': {
			if (!noClean) {
				console.log(
					`${dim(`[${date}]`)} Cleaning ${outdir} directory... ${dim(`(${entryPoints.length} files found)`)}`
				);
				await clean(outdir, date, [`!${outdir}/**/*.d.ts`]);
			}
			console.log(
				`${dim(`[${date}]`)} Building...${bundle ? '(Bundling)' : ''} ${dim(`(${entryPoints.length} files found)`)}`
			);
			await esbuild.build({
				...config,
				bundle,
				external: bundle ? Object.keys(dependencies) : undefined,
				entryPoints,
				outdir,
				outExtension: forceCJS ? { '.js': '.cjs' } : {},
				format,
				plugins: [dtsGen(buildTsConfig, outdir)],
			});
			console.log(dim(`[${date}] `) + green('√ Build Complete'));
			break;
		}
	}
}

/**
 * Run tests using the Node.js test runner.
 * @param {string[]} args - The arguments to pass to the test runner.
 * @returns {Promise<void>}
 */
async function test() {
	const args = parseArgs({
		allowPositionals: true,
		options: {
			// aka --test-name-pattern: https://nodejs.org/api/test.html#filtering-tests-by-name
			match: { type: 'string', alias: 'm' },
			// aka --test-only: https://nodejs.org/api/test.html#only-tests
			only: { type: 'boolean', alias: 'o' },
			// aka --test-concurrency: https://nodejs.org/api/test.html#test-runner-execution-model
			parallel: { type: 'boolean', alias: 'p' },
			// experimental: https://nodejs.org/api/test.html#watch-mode
			watch: { type: 'boolean', alias: 'w' },
			// Test timeout in milliseconds (default: 30000ms)
			timeout: { type: 'string', alias: 't' },
			// Test setup file
			setup: { type: 'string', alias: 's' },
			// Test teardown file
			teardown: { type: 'string' },
		},
	});

	const pattern = args.positionals[1];
	if (!pattern) throw new Error('Missing test glob pattern');

	const files = await glob(pattern, {
		filesOnly: true,
		absolute: true,
		ignore: ['**/node_modules/**'],
	});

	// For some reason, the `only` option does not work and we need to explicitly set the CLI flag instead.
	// Node.js requires opt-in to run .only tests :(
	// https://nodejs.org/api/test.html#only-tests
	if (args.values.only) {
		process.env.NODE_OPTIONS ??= '';
		process.env.NODE_OPTIONS += ' --test-only';
	}

	if (!args.values.parallel) {
		// If not parallel, we create a temporary file that imports all the test files
		// so that it all runs in a single process.
		const tempTestFile = path.resolve('./node_modules/.astro/test.mjs');
		await fs.mkdir(path.dirname(tempTestFile), { recursive: true });
		await fs.writeFile(
			tempTestFile,
			files.map((f) => `import ${JSON.stringify(pathToFileURL(f).toString())};`).join('\n')
		);

		files.length = 0;
		files.push(tempTestFile);
	}

	const teardownModule = args.values.teardown
		? await import(pathToFileURL(path.resolve(args.values.teardown)).toString())
		: undefined;

	// https://nodejs.org/api/test.html#runoptions
	run({
		files,
		testNamePatterns: args.values.match,
		concurrency: args.values.parallel,
		only: args.values.only,
		setup: args.values.setup,
		watch: args.values.watch,
		timeout: args.values.timeout ? Number(args.values.timeout) : defaultTimeout, // Node.js defaults to Infinity, so set better fallback
	})
		.on('test:fail', () => {
			// For some reason, a test fail using the JS API does not set an exit code of 1,
			// so we set it here manually
			process.exitCode = 1;
		})
		.on('end', () => {
			const testPassed = process.exitCode === 0 || process.exitCode === undefined;
			teardownModule?.default(testPassed);
		})
		.pipe(new spec())
		.pipe(process.stdout);
}

function showHelp() {
	console.log(`
${green('StudioCMS Buildkit')} - Build tool for StudioCMS packages

${yellow('Usage:')}
  buildkit <command> [...files] [...options]

${yellow('Commands:')}
  dev                     Watch files and rebuild on changes
  build                   Perform a one-time build
  test                    Run tests with Node.js test runner
  help                    Show this help message

${yellow('Dev and Build Options:')}
  --no-clean-dist         Skip cleaning the dist directory
  --bundle                Enable bundling mode
  --force-cjs             Force CommonJS output format
  --tsconfig=<path>       Specify TypeScript config file (default: tsconfig.json)
  --outdir=<path>         Specify output directory (default: dist)

${yellow('Test Options:')}
  -m, --match <pattern>   Filter tests by name pattern
  -o, --only              Run only tests marked with .only
  -p, --parallel          Run tests in parallel (default: true)
  -w, --watch             Watch for file changes and rerun tests
  -t, --timeout <ms>      Set test timeout in milliseconds (default: ${defaultTimeout})
  -s, --setup <file>      Specify setup file to run before tests
  -t, --teardown <file>   Specify teardown file to run after tests

${yellow('Examples:')}
  - buildkit dev "src/**/*.ts" --no-clean-dist
  - buildkit build "src/**/*.ts"
  - buildkit build "src/**/*.ts" --bundle --force-cjs
  - buildkit test "test/**/*.test.js" --timeout 50000 
  - buildkit test "test/**/*.test.js" --match "studiocms" --only
`);
}

export default async function main() {
	const [cmd, ...args] = process.argv.slice(2);
	switch (cmd) {
		case 'dev':
		case 'build':
			await devAndBuild(cmd, args);
			break;
		case 'test':
			await test(...args);
			break;
		default: {
			showHelp();
			break;
		}
	}
}

// THIS IS THE ENTRY POINT FOR THE CLI - DO NOT REMOVE
main();
