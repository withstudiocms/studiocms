import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Plugin } from 'vite';

export const ViteNodeAddonPlugin = (): Plugin => {
	return {
		name: 'native-addon',
		apply: 'build',
		enforce: 'pre',
		async load(id) {
			if (id.endsWith('.node') && existsSync(id)) {
				const refId = this.emitFile({
					type: 'asset',
					fileName: basename(id),
					source: await readFile(id),
				});
				const runtimePath = `./${this.getFileName(refId)}`;
				return `const id = ${JSON.stringify(runtimePath)};export default require(id);`;
			}
			return null;
		},
	};
};
