import type { Component, Editor } from 'grapesjs';
import { resolveTemplate } from '../options.js';
import type { CustomWindow, TabComponentProps, TabTemplate, TabsOptions } from '../types.js';
import type { TabComponent } from './Tab.js';

interface TabsComponent extends Component {
	addTab(): void;
	getTabContainerType(): Component;
	getContentsType(): Component;
	findTabs(): Component[];
	findContents(): Component[];
}

export default (editor: Editor, config: TabsOptions): void => {
	const { Components } = editor;

	const script = function (this: HTMLElement, props: TabComponentProps): void {
		// biome-ignore lint/complexity/noUselessThisAlias: <explanation>
		const el = this;
		const classTabActive = props.classactive;
		const selectorTab = props.selectortab;
		const { history } = window;
		const _isEditor = (window as CustomWindow)._isEditor;
		const attrSelected = 'ariaSelected';
		const roleTab = '[role=tab]';
		const roleTabContent = '[role=tabpanel]';
		const { body, location } = document;

		const matches =
			(body as HTMLElement).matches ||
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(body as any).webkitMatchesSelector ||
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(body as any).mozMatchesSelector ||
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(body as any).msMatchesSelector;

		const each = (
			items: NodeListOf<HTMLElement>,
			clb: (item: HTMLElement, index: number) => void
		): void => {
			Array.from(items).forEach(clb);
		};

		const hideContents = (): void => {
			each(el.querySelectorAll(roleTabContent), (i) => {
				(i as HTMLElement).hidden = true;
			});
		};

		const getTabId = (item: HTMLElement): string => item.getAttribute(selectorTab) || '';

		const qS = (elem: HTMLElement, qs: string): HTMLElement | null => elem.querySelector(qs);

		const getAllTabs = (): NodeListOf<HTMLElement> => el.querySelectorAll(roleTab);

		const upTabIdx = (item: HTMLElement, val: string): void => {
			if (!_isEditor) {
				(item as HTMLElement).tabIndex = Number.parseInt(val);
			}
		};

		const activeTab = (tabEl: HTMLElement): void => {
			each(getAllTabs(), (item) => {
				item.className = item.className.replace(classTabActive, '').trim();
				item.setAttribute(attrSelected, 'false');
				upTabIdx(item, '-1');
			});
			hideContents();
			tabEl.className += ` ${classTabActive}`;
			tabEl.setAttribute(attrSelected, 'true');
			upTabIdx(tabEl, '0');
			const tabContentId = getTabId(tabEl);
			const tabContent = tabContentId && qS(el, `#${tabContentId}`);
			if (tabContent) {
				(tabContent as HTMLElement).hidden = false;
			}
		};

		const getTabByHash = (): Element | null => {
			const hashId = (location.hash || '').replace('#', '');
			const qrStr = (att: string): string => `${roleTab}[${att}=${hashId}]`;
			return hashId ? qS(el, qrStr(selectorTab)) : null;
		};

		const getSelectedTab = (target: HTMLElement): HTMLElement | undefined => {
			return Array.from(getAllTabs()).find((item) => item.contains(target));
		};

		let tabToActive = qS(el, `.${classTabActive}${roleTab}`) as HTMLElement | null;
		tabToActive =
			tabToActive ||
			(getTabByHash() as HTMLElement | null) ||
			(qS(el, roleTab) as HTMLElement | null);
		if (tabToActive) activeTab(tabToActive as HTMLElement);

		el.addEventListener('click', (ev: MouseEvent & { __trg?: number }) => {
			let target = ev.target as HTMLElement | null;
			if (!target) return;

			let found = matches.call(target, roleTab);

			if (!found) {
				const selectedTab = getSelectedTab(target);
				if (selectedTab) {
					target = selectedTab;
					found = true;
				}
			}

			if (found && !ev.__trg && (target as HTMLElement).className.indexOf(classTabActive) < 0) {
				ev.preventDefault();
				ev.__trg = 1;
				activeTab(target as HTMLElement);
				const id = getTabId(target as HTMLElement);
				try {
					history?.pushState(null, '', `#${id}`);
				} catch (e) {
					console.error('History API is not supported', e);
				}
			}
		});
	};

	const styleText = config.style ? config.style(config) : '';

	const defTabs = [1, 2, 3].map((i) => ({
		type: config.typeTab,
		components: resolveTemplate(config.templateTab, { index: i }),
	}));

	Components.addType(config.typeTabs, {
		model: {
			defaults: {
				name: 'Tabs',
				classactive: config.classTabActive,
				selectortab: config.selectorTab,
				'script-props': ['classactive', 'selectortab'],
				script,
				traits: [
					{
						type: 'button',
						label: 'Add Tab',
						text: 'Add Tab',
						full: true,
						command: (editor: Editor) => {
							const selected = editor.getSelected() as TabsComponent;
							selected?.addTab();
						},
					},
				],
				components: [
					{ type: config.typeTabContainer, components: defTabs },
					{ type: config.typeTabContents },
				],
				styles: styleText,
				...config.tabsProps,
			},

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			isTabsComponent(comp: any): comp is TabsComponent {
				return comp.findTabs !== undefined;
			},

			init() {
				// biome-ignore lint/complexity/noUselessThisAlias: <explanation>
				const component = this;

				component.findTabs().forEach((tab: TabComponent, index: number) => {
					this.__onTab(tab, index + 1, {});
				});

				const container = component.getTabContainerType();
				let tabCount = component.findTabs().length;

				this.listenTo(container?.components(), 'add', (tab: TabComponent) => {
					tabCount++;
					tab.__initTab?.(tabCount);
				});
			},

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			__onTab(tab: TabComponent, index: number, v: any, opts: any = {}) {
				if (!opts.avoidStore && !opts.temporary) {
					tab.__initTab(index);
				}
			},

			getTabContainerType() {
				return this.findType(config.typeTabContainer)[0];
			},

			getContentsType() {
				return this.findType(config.typeTabContents)[0] || this;
			},

			findTabs() {
				return this.findType(config.typeTab);
			},

			findContents() {
				return this.findType(config.typeTabContent);
			},

			addTab(content?: string | TabTemplate) {
				const component = this as unknown as TabsComponent;
				const container = component.getTabContainerType();
				const currentTabs = component.findTabs();

				const templateProps = {
					index: currentTabs.length + 1,
				};

				const finalContent = content
					? typeof content === 'function'
						? content(templateProps)
						: content
					: resolveTemplate(config.templateTab, templateProps);

				container?.append({
					type: config.typeTab,
					components: finalContent,
				});
			},
		},
	});
};
