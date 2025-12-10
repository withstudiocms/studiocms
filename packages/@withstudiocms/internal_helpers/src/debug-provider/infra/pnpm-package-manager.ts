import type { CommandExecutor, PackageManager } from '../definitions.js';

function formatPnpmVersionOutput(versionOutput: string): string {
	return versionOutput.startsWith('link:') ? 'Local' : `v${versionOutput}`;
}

interface BareNpmLikeVersionOutput {
	version: string;
	dependencies: Record<string, BareNpmLikeVersionOutput>;
}

/**
 * Represents the PNPM package manager.
 */
export class PnpmPackageManager implements PackageManager {
	readonly name: string = 'pnpm';
	readonly #commandExecutor: CommandExecutor;

	constructor({ commandExecutor }: { commandExecutor: CommandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}

	#processPnpmWhyOutput(name: string, pnpmWhy: string) {
		const parsedOutput = JSON.parse(pnpmWhy) as Array<BareNpmLikeVersionOutput>;

		const deps = parsedOutput[0].dependencies;

		if (parsedOutput.length === 0 || !deps) {
			return undefined;
		}

		const userProvidedDependency = deps[name];

		if (userProvidedDependency) {
			return formatPnpmVersionOutput(userProvidedDependency.version);
		}

		const studiocmsDependency = deps.studiocms?.dependencies[name];
		if (studiocmsDependency) {
			return formatPnpmVersionOutput(studiocmsDependency.version);
		}

		const astroDependency = deps.astro?.dependencies[name];
		return astroDependency ? formatPnpmVersionOutput(astroDependency.version) : undefined;
	}

	#processPnpmLsOutput(name: string, pnpmLs: string) {
		const parsedOutput = JSON.parse(pnpmLs) as Array<BareNpmLikeVersionOutput>;

		const deps = parsedOutput[0].dependencies;

		if (parsedOutput.length === 0 || !deps) {
			return undefined;
		}

		const userProvidedDependency = deps[name];

		if (userProvidedDependency) {
			return formatPnpmVersionOutput(userProvidedDependency.version);
		}
	}

	async getPackageVersion(name: string): Promise<string | undefined> {
		try {
			// https://pnpm.io/cli/ls
			const { stdout: pnpmLs } = await this.#commandExecutor.execute('pnpm', ['ls', '--json'], {
				shell: true,
			});

			const lsVersion = this.#processPnpmLsOutput(name, pnpmLs);

			if (lsVersion) {
				return lsVersion;
			}

			// https://pnpm.io/cli/why
			const { stdout: pnpmWhy } = await this.#commandExecutor.execute(
				'pnpm',
				['why', name, '--json'],
				{
					shell: true,
				}
			);

			return this.#processPnpmWhyOutput(name, pnpmWhy);
		} catch {
			return undefined;
		}
	}
}
