import type { HookParameters } from 'astro';
import { type Imports, virtualImportsPlugin } from '../vite/index.js';

export type VirtualImportsPluginOptions = {
	name: string;
	imports: Imports;
};

export const addVirtualImports = (
	{ updateConfig }: Pick<HookParameters<'astro:config:setup'>, 'updateConfig'>,
	{ name, imports }: VirtualImportsPluginOptions
) => {
	updateConfig({
		vite: {
			plugins: [virtualImportsPlugin(name, imports)],
		},
	});
};
