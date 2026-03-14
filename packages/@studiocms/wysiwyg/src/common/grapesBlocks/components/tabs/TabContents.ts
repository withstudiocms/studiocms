import type { Editor } from 'grapesjs';
import type { TabContentsConfig } from '../../types.js';

export default (editor: Editor, config: TabContentsConfig): void => {
	const { Components } = editor;

	Components.addType(config.typeTabContents, {
		model: {
			defaults: {
				name: 'Tab Contents',
				draggable: false,
				droppable: false,
				copyable: false,
				removable: false,
				classes: config.classTabContents,
				...config.tabContentsProps,
			},
		},
	});
};
