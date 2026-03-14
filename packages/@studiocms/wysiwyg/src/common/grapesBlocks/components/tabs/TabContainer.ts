import type { Editor } from 'grapesjs';
import type { TabContainerConfig } from '../../types.js';

export const role = 'tablist';

export default (editor: Editor, config: TabContainerConfig): void => {
	const { Components } = editor;

	Components.addType(config.typeTabContainer, {
		model: {
			defaults: {
				name: 'Tab Container',
				draggable: `[data-gjs-type="${config.typeTabs}"]`,
				droppable: `[data-gjs-type="${config.typeTab}"]`,
				copyable: false,
				removable: false,
				highlightable: false,
				attributes: { role },
				classes: config.classTabContainer,
				...config.tabContainerProps,
			},
		},
	});
};
