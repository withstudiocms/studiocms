#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import esbuild from 'esbuild';
import glob from 'fast-glob';
import { dim, gray, green, red, yellow } from 'kleur/colors';

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

export default async function run() {
	const [cmd, ...args] = process.argv.slice(2);
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

	if (!noClean) {
		console.log(
			`${dim(`[${date}]`)} Cleaning ${outdir} directory... ${dim(`(${entryPoints.length} files found)`)}`
		);
		await clean(outdir, date, [`!${outdir}/**/*.d.ts`]);
	}

	switch (cmd) {
		case 'dev': {
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
		case 'help': {
			showHelp();
			break;
		}
		default: {
			showHelp();
			break;
		}
	}
}

function showHelp() {
	console.log(`
${green('StudioCMS Buildkit')} - Build tool for StudioCMS packages

${yellow('Usage:')}
  withstudiocms-buildkit <command> [...files] [...options]

${yellow('Commands:')}
  dev     Watch files and rebuild on changes
  build   Perform a one-time build
  help    Show this help message

${yellow('Options:')}
  --no-clean-dist    Skip cleaning the dist directory
  --bundle          Enable bundling mode
  --force-cjs       Force CommonJS output format
  --tsconfig=<path> Specify TypeScript config file (default: tsconfig.json)
  --outdir=<path>   Specify output directory (default: dist)

${yellow('Examples:')}
  withstudiocms-buildkit build "src/**/*.ts"
  withstudiocms-buildkit dev "src/**/*.ts" --no-clean-dist
  withstudiocms-buildkit build "src/**/*.ts" --bundle --force-cjs
`);
}

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

// THIS IS THE ENTRY POINT FOR THE CLI - DO NOT REMOVE
run();
