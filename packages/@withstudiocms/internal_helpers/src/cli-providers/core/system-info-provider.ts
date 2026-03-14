import type { SystemInfoProvider } from '../definitions.js';

/**
 * Provides system information based on the current process.
 */
export class ProcessSystemInfoProvider implements SystemInfoProvider {
	readonly #platformToOs: Partial<Record<NodeJS.Platform, string>> = {
		win32: 'Windows',
		darwin: 'macOS',
		linux: 'Linux',
		aix: 'AIX',
		freebsd: 'FreeBSD',
		openbsd: 'OpenBSD',
		sunos: 'SunOS',
	};

	readonly #archToArchName: Partial<Record<NodeJS.Architecture, string>> = {
		x64: 'x64',
		arm64: 'ARM64',
		ia32: 'x86',
		arm: 'ARM',
		mips: 'MIPS',
		ppc: 'PowerPC',
	};

	readonly name: NodeJS.Platform = process.platform;
	readonly displayName: string =
		`${this.#platformToOs[this.name] ?? this.name} (${this.#archToArchName[process.arch] ?? process.arch})`;
}
