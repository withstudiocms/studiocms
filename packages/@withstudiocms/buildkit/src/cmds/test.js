import fs from 'node:fs/promises';
import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import chalk from 'chalk';
import { glob } from 'tinyglobby';

/**
 * @type {boolean} Indicates if the script is running in a CI environment.
 */
const isCI = !!process.env.CI;

/** * Default timeout for tests in milliseconds.
 * In CI, we set a longer timeout to accommodate potential delays.
 * In local development, we use a shorter timeout for faster feedback.
 * @type {number}
 */
const defaultTimeout = isCI ? 1400000 : 600000;

// DateTime format for logging
/**
 * @type {Intl.DateTimeFormat}
 */
const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

/**
 * Run tests using the Node.js test runner.
 * @param {string[]} args - The command line arguments for the test command.
 */
export default async function test(args) {
	const parsedArgs = parseArgs({
		args,
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

	// Find the package.json file in the current directory
	// and read it to get the project name
	const packageJSONPath = path.resolve('./package.json');
	let packageJSON;
	try {
		packageJSON = JSON.parse(await fs.readFile(packageJSONPath, { encoding: 'utf8' }));
	} catch (error) {
		throw new Error(`Failed to read package.json: ${error.message}`);
	}

	console.log(
		`${chalk.dim(`[${dt.format(new Date())}]`)} Running tests for ${chalk.bold(packageJSON.name)}...\n`
	);

	const start = Date.now();

	const pattern = parsedArgs.positionals[0];
	if (!pattern) throw new Error('Missing test glob pattern');

	const files = await glob(pattern, {
		onlyFiles: true,
		absolute: true,
		ignore: ['**/node_modules/**'],
	});

	if (files.length === 0) {
		throw new Error(`No test files found matching pattern: ${pattern}`);
	}

	// For some reason, the `only` option does not work and we need to explicitly set the CLI flag instead.
	// Node.js requires opt-in to run .only tests :(
	// https://nodejs.org/api/test.html#only-tests
	if (parsedArgs.values.only) {
		process.env.NODE_OPTIONS ??= '';
		process.env.NODE_OPTIONS += ' --test-only';
	}

	if (!parsedArgs.values.parallel) {
		// If not parallel, we create a temporary file that imports all the test files
		// so that it all runs in a single process.
		const tempTestFile = path.resolve('./node_modules/.withstudiocms/test.mjs');
		await fs.mkdir(path.dirname(tempTestFile), { recursive: true });
		await fs.writeFile(
			tempTestFile,
			files.map((f) => `import ${JSON.stringify(pathToFileURL(f).toString())};`).join('\n')
		);

		files.length = 0;
		files.push(tempTestFile);
	}

	const teardownModule = parsedArgs.values.teardown
		? await import(pathToFileURL(path.resolve(parsedArgs.values.teardown)).toString())
		: undefined;

	// https://nodejs.org/api/test.html#runoptions
	run({
		files,
		testNamePatterns: parsedArgs.values.match,
		concurrency: parsedArgs.values.parallel,
		only: parsedArgs.values.only,
		setup: parsedArgs.values.setup,
		watch: parsedArgs.values.watch,
		timeout: parsedArgs.values.timeout ? Number(parsedArgs.values.timeout) : defaultTimeout, // Node.js defaults to Infinity, so set better fallback
	})
		.on('test:fail', () => {
			// For some reason, a test fail using the JS API does not set an exit code of 1,
			// so we set it here manually
			process.exitCode = 1;
		})
		.on('end', () => {
			const testPassed = process.exitCode === 0 || process.exitCode === undefined;
			teardownModule?.default(testPassed);
			const end = Date.now();
			console.log(
				`\n${chalk.dim(`[${dt.format(new Date())}]`)} Tests for ${chalk.bold(packageJSON.name)} completed in ${((end - start) / 1000).toFixed(2)} seconds. ${
					process.exitCode === 0 || process.exitCode === undefined
						? chalk.green('All tests passed!')
						: chalk.red('Some tests failed!')
				}`
			);
		})
		.pipe(new spec())
		.pipe(process.stdout);
}
