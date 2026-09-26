import type { Editor } from 'grapesjs';
import type { RequiredTabsOptions, TabsOptions } from '../types.js';
import Tab from './tabs/Tab.js';
import TabContainer from './tabs/TabContainer.js';
import TabContent from './tabs/TabContent.js';
import TabContents from './tabs/TabContents.js';
import Tabs from './tabs/Tabs.js';

type ComponentLoader = (editor: Editor, config: TabsOptions) => void;

// Define loading order for proper dependency resolution
const components: ComponentLoader[] = [
	TabContainer, // Load container first
	TabContent, // Then content components
	TabContents,
	Tab, // Then individual tabs
	Tabs, // Finally the main tabs component
];

export default (editor: Editor, config: RequiredTabsOptions) => {
	const opts = {
		...config,
		defaultModel: editor.DomComponents.getType('default').model,
		editor,
	};

	for (const component of components) {
		component(editor, opts);
	}
};
