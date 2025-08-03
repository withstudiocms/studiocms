import type { Component, Editor } from 'grapesjs';
import { resolveTemplate } from '../options.js';
import type { TabConfig } from '../types.js';

export interface TabComponent extends Component {
	tabContent?: Component;
	__initTab(index: number): void;
	__onRemove(): void;
	getTabContent(): Component | undefined;
}

export default (editor: Editor, config: TabConfig) => {
	const { Components } = editor;

	const prevSelectorTab = 'data-prev';
	const getPrevCntId = (comp: Component) => comp.getAttributes()[prevSelectorTab];
	const defaultModel = editor.DomComponents.getType('default').model;

	Components.addType(config.typeTab, {
		model: {
			defaults: {
				name: 'Tab',
				tagName: 'div',
				draggable: `[data-gjs-type="${config.typeTabContainer}"]`,
				droppable: false,
				attributes: { role: 'tab' },
				classes: [config.classTab],
				traits: [
					{
						type: 'button',
						label: false,
						text: 'Style Active',
						full: true,
						command: (editor: Editor) => {
							const sm = editor.StyleManager;
							sm.select(`.${config.classTab}.${config.classTabActive}`);
						},
					},
				],
				...config.tabProps,
			},

			init() {
				this.on('removed', this.__onRemove);
			},

			__initTab(index: number) {
				if (this.tabContent) return;

				let content = this.getTabContent();

				if (content && getPrevCntId(content)) {
					const id = content.getId();
					const tabId = this.getId();
					content.addAttributes({ id, 'aria-labelledby': tabId, hidden: true });
					content.removeAttributes(prevSelectorTab);
					this.addAttributes({ [config.selectorTab]: id, id: tabId });
				}

				if (!content) {
					const tabs = this.getTabsType();
					const cnts = tabs.getContentsType();
					content = cnts.append({
						type: config.typeTabContent,
						components: resolveTemplate(config.templateTabContent, {
							index: index,
						}),
					})[0];
					const id = content.getId();
					const tabId = this.getId();
					content.addAttributes({ id, 'aria-labelledby': tabId, hidden: true });
					this.addAttributes({ [config.selectorTab]: id, id: tabId });
					this.tabContent = content;
				}

				this.tabContent = content;
			},

			__onRemove() {
				const content = this.getTabContent();
				if (content) {
					content.remove();
				}
				this.getTabsType().trigger('rerender');
			},

			getTabsType() {
				return this.closestType(config.typeTabs);
			},

			getTabContent() {
				const id = this.getAttributes()[config.selectorTab];
				const tabs = this.getTabsType();
				if (!tabs || !id) return;
				const contents = tabs.findContents();
				const content = contents.filter(
					(c: Component) => c.getId() === id || getPrevCntId(c) === id
				)[0];
				return content;
			},

			// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			clone(opt: { _inner?: boolean; symbol?: boolean; symbolInv?: boolean } = {}, ...args: any[]) {
				const fromParent = opt._inner;
				if (fromParent) {
					const tabCont = this.getTabContent();
					if (tabCont) {
						tabCont.addAttributes({ [prevSelectorTab]: tabCont.getId() });
					}
				}
				const cloned = defaultModel.prototype.clone.apply(this, [opt, ...args]);
				if (!fromParent) {
					cloned.addAttributes({ [config.selectorTab]: '' });
				}
				return cloned;
			},
		},
	});
};
