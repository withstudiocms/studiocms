import type { PackageManager, PackageManagerUserAgentProvider } from '../definitions.js';

interface Options {
	packageManagerUserAgentProvider: PackageManagerUserAgentProvider;
}

/**
 * Determines the package manager based on the user agent string.
 *
 * @param options - The options object containing the user agent provider.
 * @returns A promise that resolves to the appropriate PackageManager instance.
 */
export async function getPackageManager({
	packageManagerUserAgentProvider,
}: Options): Promise<PackageManager> {
	if (!packageManagerUserAgentProvider.userAgent) {
		const { NoopPackageManager } = await import('../infra/noop-package-manager.js');
		return new NoopPackageManager();
	}
	const specifier = packageManagerUserAgentProvider.userAgent.split(' ')[0];
	const _name = specifier.substring(0, specifier.lastIndexOf('/'));
	const name = _name === 'npminstall' ? 'cnpm' : _name;

	switch (name) {
		case 'pnpm': {
			const { PnpmPackageManager } = await import('../infra/pnpm-package-manager.js');
			return new PnpmPackageManager();
		}
		case 'npm': {
			const { NpmPackageManager } = await import('../infra/npm-package-manager.js');
			return new NpmPackageManager();
		}
		case 'yarn': {
			const { YarnPackageManager } = await import('../infra/yarn-package-manager.js');
			return new YarnPackageManager();
		}
		case 'bun': {
			const { BunPackageManager } = await import('../infra/bun-package-manager.js');
			return new BunPackageManager();
		}
		default: {
			const { NoopPackageManager } = await import('../infra/noop-package-manager.js');
			return new NoopPackageManager();
		}
	}
}
