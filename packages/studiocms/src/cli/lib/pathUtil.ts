import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function pathUtil(importMetaUrl: string) {
	const filename = fileURLToPath(importMetaUrl);
	const dirname = path.dirname(filename);

	return {
		filename,
		dirname,
		getRelPath: (...url: string[]) => path.join(dirname, ...url),
	};
}
