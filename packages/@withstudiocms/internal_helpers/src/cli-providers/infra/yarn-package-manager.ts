import type { CommandExecutor, PackageManager } from '../definitions.js';

/**
 * Represents the structure of a single line of output from the `yarn why --json` command.
 */
interface YarnVersionOutputLine {
	children: Record<string, { locator: string }>;
}

/**
 * Extracts the version of a specified dependency from a line of Yarn output.
 *
 * @param dependency - The name of the dependency to find.
 * @param outputLine - A line of output from the `yarn why --json` command.
 * @returns The version string of the dependency, or undefined if not found.
 */
function getYarnOutputDepVersion(dependency: string, outputLine: string) {
	const parsed = JSON.parse(outputLine) as YarnVersionOutputLine;

	for (const [key, value] of Object.entries(parsed.children)) {
		if (key.startsWith(`${dependency}@`)) {
			return `v${value.locator.split(':').pop()}`;
		}
	}
}

/**
 * Represents the Yarn package manager.
 */
export class YarnPackageManager implements PackageManager {
	readonly name: string = 'yarn';
	readonly #commandExecutor: CommandExecutor;

	constructor({ commandExecutor }: { commandExecutor: CommandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}

	async getPackageVersion(name: string): Promise<string | undefined> {
		try {
			// https://yarnpkg.com/cli/why
			const { stdout } = await this.#commandExecutor.execute('yarn', ['why', name, '--json'], {
				shell: true,
			});

			const hasUserDefinition = stdout.includes('workspace:.');
			for (const line of stdout.split('\n')) {
				if (hasUserDefinition && line.includes('workspace:.'))
					return getYarnOutputDepVersion(name, line);
				if (hasUserDefinition && line.includes('studiocms@'))
					return getYarnOutputDepVersion(name, line);
				if (!hasUserDefinition && line.includes('astro@'))
					return getYarnOutputDepVersion(name, line);
			}
		} catch {
			return undefined;
		}
	}
}
