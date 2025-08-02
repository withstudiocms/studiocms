import type { Editor } from 'grapesjs';
import type { RequiredPluginOptions } from './index.js';
import { cmpId } from './utils.js';

export default (editor: Editor, opts: RequiredPluginOptions) => {
	const bm = editor.BlockManager;
	const { block } = opts;

	block &&
		bm.add(cmpId, {
			label: 'Typed',
			media:
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><path d="M212.3 44l2.3 49.6h-6A60 60 0 00204 75c-3.2-6-7.5-10.5-12.9-13.3a44.9 44.9 0 00-21.1-4.3h-29.8V219c0 13 1.4 21 4.2 24.3 4 4.4 10 6.6 18.2 6.6h7.4v5.7H80.2V250h7.5c9 0 15.3-2.7 19-8.2 2.4-3.3 3.5-10.9 3.5-22.7V57.3H84.8a71 71 0 00-21.1 2.2 29 29 0 00-13.9 11.3 46.1 46.1 0 00-6.9 22.8H37L39.5 44h172.8zM245 22h18v256h-18z"/></svg>',
			content: { type: cmpId },
			select: true,
			...block,
		});
};
