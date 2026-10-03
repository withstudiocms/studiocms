import type { PluginOption } from 'vite';

export type VirtualImport = {
	id: string;
	content: string;
	context?: 'server' | 'client' | undefined;
};

export type Imports = Record<string, string> | Array<VirtualImport>;

const matchesContext = (
	virtualImport: VirtualImport,
	options?: {
		ssr?: boolean;
	}
): boolean => {
	if (virtualImport.context === undefined) {
		return true;
	}

	// Preserve backward compatibility when context metadata is unavailable.
	if (options?.ssr === undefined) {
		return true;
	}

	return virtualImport.context === 'server' ? options.ssr === true : options.ssr === false;
};

export function virtualImportsPlugin(name: string, imports: Imports): PluginOption {
	const normalizedImports: Record<string, VirtualImport> = Array.isArray(imports)
		? Object.fromEntries(imports.map((imp) => [imp.id, imp]))
		: Object.fromEntries(Object.entries(imports).map(([id, content]) => [id, { id, content }]));

	return {
		name,
		resolveId(id: string, _importer, options) {
			const virtualImport = normalizedImports[id];

			if (!virtualImport || !matchesContext(virtualImport, options)) {
				return;
			}

			return `\0${id}`;
		},
		load(id: string, options) {
			if (!id.startsWith('\0')) {
				return;
			}

			const virtualImport = normalizedImports[id.slice(1)];
			if (!virtualImport || !matchesContext(virtualImport, options)) {
				return;
			}

			return virtualImport.content;
		},
	};
}
