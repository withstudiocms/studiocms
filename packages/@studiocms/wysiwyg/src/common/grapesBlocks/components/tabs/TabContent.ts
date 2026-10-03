import type { Editor } from 'grapesjs';
import type { TabContentConfig } from '../../types.js';

export const role = 'tabpanel';

export default (editor: Editor, config: TabContentConfig): void => {
	const { Components } = editor;

	Components.addType(config.typeTabContent, {
		model: {
			defaults: {
				name: 'Tab Content',
				draggable: false,
				copyable: false,
				removable: false,
				highlightable: false,
				attributes: { role },
				classes: config.classTabContent,
				traits: [],
				...config.tabContentProps,
			},
		},
	});
};
