import { styleText } from 'node:util';

/**
 * Show the help message for the buildkit CLI.
 */
export default function showHelp() {
	console.log(`
${styleText('green', 'StudioCMS Buildkit')} - Build tool for StudioCMS packages

${styleText('yellow', 'Usage:')}
  buildkit <command> [...files] [...options]

${styleText('yellow', 'Commands:')}
  dev                     Watch files and rebuild on changes
  build                   Perform a one-time build
  help                    Show this help message

${styleText('yellow', 'Dev and Build Options:')}
  --no-clean-dist         Skip cleaning the dist directory
  --bundle                Enable bundling mode
  --force-cjs             Force CommonJS output format
  --tsconfig=<path>       Specify TypeScript config file (default: tsconfig.json)
  --outdir=<path>         Specify output directory (default: dist)

${styleText('yellow', 'Examples:')}
  - buildkit dev "src/**/*.ts" --no-clean-dist
  - buildkit build "src/**/*.ts"
  - buildkit build "src/**/*.ts" --bundle --force-cjs
`);
}
