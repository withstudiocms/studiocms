import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import chalk from 'chalk';
import esbuild from 'esbuild';
import { glob } from 'tinyglobby';

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

/**
 * Plugin to copy *.stub.(js|mjs|cjs) without parsing/bundling.
 * NOTE: Importing these will yield a file URL string at runtime, not executed JS.
 * @type {import('esbuild').Plugin} The esbuild plugin for generating TypeScript declarations.
 */
const copyStubJsPlugin = {
	name: 'copy-stub-js',
	setup(build) {
		// Match both entry points and imported modules
		const filter = /\.stub\.(?:js|mjs|cjs)$/;
		build.onLoad({ filter }, async (args) => {
			const contents = await fs.readFile(args.path);
			return { contents, loader: 'copy' };
		});
	},
};

/**
 * Plugin to copy *.d.ts without parsing/bundling.
 * NOTE: Importing these will yield a file URL string at runtime, not executed JS.
 * @type {import('esbuild').Plugin} The esbuild plugin for generating TypeScript declarations.
 */
const copyDTSPlugin = {
	name: 'copy-dts',
	setup(build) {
		// Match both entry points and imported modules
		const filter = /\.d\.ts$/;
		build.onLoad({ filter }, async (args) => {
			const contents = await fs.readFile(args.path);
			return { contents, loader: 'copy' };
		});
	},
};

const copyPlugins = [copyStubJsPlugin, copyDTSPlugin];

// DateTime format for logging
/**
 * @type {Intl.DateTimeFormat}
 */
const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

/** * Plugin to generate TypeScript declarations using the TypeScript compiler.
 * @param {string} buildTsConfig - The path to the TypeScript configuration file.
 * @param {string} outdir - The output directory for the generated declarations.
 * @returns {import('esbuild').Plugin} The esbuild plugin for generating TypeScript declarations.
 */
const dtsGen = (buildTsConfig, outdir) => ({
	name: 'TypeScriptDeclarationsPlugin',
	setup(build) {
		build.onEnd((result) => {
			if (result.errors.length > 0) return;
			const date = dt.format(new Date());
			console.log(`${chalk.dim(`[${date}]`)} Generating TypeScript declarations...`);
			try {
				const res = execFileSync(
					'tsc',
					['--emitDeclarationOnly', '-p', buildTsConfig, '--outDir', `./${outdir}`],
					{ encoding: 'utf8' }
				);
				if (res) console.log(res);
				console.log(chalk.dim(`[${date}] `) + chalk.green('√ Generated TypeScript declarations'));
			} catch (error) {
				const msg =
					(error && (error.message || String(error))) +
					'\n\n' +
					// stdout/stderr may be Buffer or string depending on exec options
					(typeof error?.stdout === 'string' ? error.stdout : (error?.stdout?.toString?.() ?? '')) +
					(typeof error?.stderr === 'string' ? error.stderr : (error?.stderr?.toString?.() ?? ''));
				console.error(chalk.dim(`[${date}] `) + chalk.red(msg));
			}
		});
	},
});

/** * Clean the output directory by removing all files except those specified in the skip array.
 * @param {string} outdir - The output directory to clean.
 * @param {string} date - The date string for logging.
 * @param {string[]} skip - An array of glob patterns to skip when cleaning.
 * @throws {Error} If the glob operation fails or if there are issues removing files.
 */
async function clean(outdir, date, skip = []) {
	const files = await glob([`${outdir}/**`, ...skip], { filesOnly: true });
	console.log(chalk.dim(`[${date}] `) + chalk.dim(`Cleaning ${files.length} files from ${outdir}`));
	await Promise.all(files.map((file) => fs.rm(file, { force: true })));
}

/** * Read and parse the package.json file.
 * @param {string} path - The path to the package.json file.
 * @returns {Promise<Object>} The parsed JSON object.
 * @throws {Error} If the file cannot be read or is not valid JSON.
 */
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
 */
export default async function builder(cmd, args) {
	const config = Object.assign({}, defaultConfig);
	const patterns = args
		.filter((f) => !!f) // remove empty args
		.map((f) => f.replace(/^'/, '').replace(/'$/, '')); // Needed for Windows: glob strings contain surrounding string chars??? remove these

	/**
	 * Collect all entry points based on the provided patterns.
	 * @type {string[]}
	 */
	const entryPoints = [].concat(
		...(await Promise.all(
			patterns.map((pattern) => glob(pattern, { filesOnly: true, absolute: true }))
		))
	);

	if (entryPoints.length === 0) {
		throw new Error(`No entry points found for pattern(s): ${patterns.join(', ')}`);
	}

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
					`${chalk.dim(`[${date}]`)} Cleaning ${outdir} directory... ${chalk.dim(`(${entryPoints.length} files found)`)}`
				);
				await clean(outdir, date, [`!${outdir}/**/*.d.ts`]);
			}

			/**
			 * Plugin to handle rebuilds during development.
			 * It logs the result of the build process and any warnings or errors.
			 * @type {import('esbuild').Plugin}
			 * @description This plugin is used to provide feedback during development builds.
			 */
			const rebuildPlugin = {
				name: 'dev:rebuild',
				setup(build) {
					build.onEnd(async (result) => {
						const date = dt.format(new Date());
						if (result?.errors.length) {
							const formatted = await esbuild.formatMessages(result.errors, {
								kind: 'error',
								color: true,
							});
							console.error(chalk.dim(`[${date}] `) + chalk.red(formatted.join('\n')));
							return;
						}
						if (result.warnings.length) {
							const formattedWarns = await esbuild.formatMessages(result.warnings, {
								kind: 'warning',
								color: true,
							});
							console.info(
								chalk.dim(`[${date}] `) +
									chalk.yellow(`! updated with warnings:\n${formattedWarns.join('\n')}`)
							);
						}
						console.info(chalk.dim(`[${date}] `) + chalk.green('√ updated'));
					});
				},
			};

			const builder = await esbuild.context({
				...config,
				entryPoints,
				outdir,
				format,
				sourcemap: 'linked',
				plugins: [rebuildPlugin, ...copyPlugins],
			});

			console.log(
				`${chalk.dim(`[${date}] `) + chalk.gray('Watching for changes...')} ${chalk.dim(`(${entryPoints.length} files found)`)}`
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
					`${chalk.dim(`[${date}]`)} Cleaning ${outdir} directory... ${chalk.dim(`(${entryPoints.length} files found)`)}`
				);
				await clean(outdir, date, [`!${outdir}/**/*.d.ts`]);
			}
			console.log(
				`${chalk.dim(`[${date}]`)} Building...${bundle ? '(Bundling)' : ''} ${chalk.dim(`(${entryPoints.length} files found)`)}`
			);
			await esbuild.build({
				...config,
				bundle,
				external: bundle ? Object.keys(dependencies) : undefined,
				entryPoints,
				outdir,
				outExtension: forceCJS ? { '.js': '.cjs' } : {},
				format,
				plugins: [dtsGen(buildTsConfig, outdir), ...copyPlugins],
			});
			console.log(chalk.dim(`[${date}] `) + chalk.green('√ Build Complete'));
			break;
		}
	}
}
