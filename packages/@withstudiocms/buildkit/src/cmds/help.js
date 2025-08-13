#!/usr/bin/env node
import chalk from 'chalk';

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

/**
 * Show the help message for the buildkit CLI.
 */
export default function showHelp() {
  console.log(`
${chalk.green('StudioCMS Buildkit')} - Build tool for StudioCMS packages

${chalk.yellow('Usage:')}
  buildkit <command> [...files] [...options]

${chalk.yellow('Commands:')}
  dev                     Watch files and rebuild on changes
  build                   Perform a one-time build
  test                    Run tests with Node.js test runner
  help                    Show this help message

${chalk.yellow('Dev and Build Options:')}
  --no-clean-dist         Skip cleaning the dist directory
  --bundle                Enable bundling mode
  --force-cjs             Force CommonJS output format
  --tsconfig=<path>       Specify TypeScript config file (default: tsconfig.json)
  --outdir=<path>         Specify output directory (default: dist)

${chalk.yellow('Test Options:')}
  -m, --match <pattern>   Filter tests by name pattern
  -o, --only              Run only tests marked with .only
  -p, --parallel          Run tests in parallel (default: true)
  -w, --watch             Watch for file changes and rerun tests
  -t, --timeout <ms>      Set test timeout in milliseconds (default: ${defaultTimeout})
  -s, --setup <file>      Specify setup file to run before tests
  --teardown <file>       Specify teardown file to run after tests

${chalk.yellow('Examples:')}
  - buildkit dev "src/**/*.ts" --no-clean-dist
  - buildkit build "src/**/*.ts"
  - buildkit build "src/**/*.ts" --bundle --force-cjs
  - buildkit test "test/**/*.test.js" --timeout 50000 
  - buildkit test "test/**/*.test.js" --match "studiocms" --only
`);
}