import type { Editor } from 'grapesjs';
import type { TabsOptions } from '../types.js';
import Tab from './Tab.js';
import TabContainer from './TabContainer.js';
import TabContent from './TabContent.js';
import TabContents from './TabContents.js';
import Tabs from './Tabs.js';

type ComponentLoader = (editor: Editor, config: TabsOptions) => void;

// Define loading order for proper dependency resolution
const components: ComponentLoader[] = [
	TabContainer, // Load container first
	TabContent, // Then content components
	TabContents,
	Tab, // Then individual tabs
	Tabs, // Finally the main tabs component
];

export default (editor: Editor, config: TabsOptions): void => {
	const opts = {
		...config,
		defaultModel: editor.DomComponents.getType('default').model,
		editor,
	};

	for (const component of components) {
		component(editor, opts);
	}
};
