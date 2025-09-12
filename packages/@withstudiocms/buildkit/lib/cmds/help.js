import chalk from 'chalk';

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
  help                    Show this help message

${chalk.yellow('Dev and Build Options:')}
  --no-clean-dist         Skip cleaning the dist directory
  --bundle                Enable bundling mode
  --force-cjs             Force CommonJS output format
  --tsconfig=<path>       Specify TypeScript config file (default: tsconfig.json)
  --outdir=<path>         Specify output directory (default: dist)

${chalk.yellow('Examples:')}
  - buildkit dev "src/**/*.ts" --no-clean-dist
  - buildkit build "src/**/*.ts"
  - buildkit build "src/**/*.ts" --bundle --force-cjs
`);
}
