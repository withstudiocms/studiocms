import type { Editor } from 'grapesjs';
import type { PluginOptions } from './index.js';
import { typeCustomCode } from './utils.js';

export default (editor: Editor, { blockCustomCode }: PluginOptions = {}) => {
	const { Blocks } = editor;

	blockCustomCode &&
		Blocks.add(typeCustomCode, {
			label: 'Custom Code',
			media: `
      <svg viewBox="0 0 24 24">
        <path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4m-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z"></path>
      </svg>
    `,
			category: 'Extra',
			activate: true,
			select: true,
			content: { type: typeCustomCode },
			...blockCustomCode,
		});
};
