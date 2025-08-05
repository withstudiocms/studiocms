import type { Editor } from 'grapesjs';

export const loadI18n = (editor: Editor) => {
	editor.I18n.addMessages({
		en: {
			styleManager: {
				properties: {
					'background-repeat': 'Repeat',
					'background-position': 'Position',
					'background-attachment': 'Attachment',
					'background-size': 'Size',
				},
			},
		},
	});
};

export default loadI18n;