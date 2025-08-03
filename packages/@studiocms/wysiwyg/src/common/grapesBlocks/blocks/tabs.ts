import type { BlockProperties, Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions, RequiredTabsOptions } from '../types.js';

export default (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	const addBlock = (id: string, def: BlockProperties) => {
		// biome-ignore lint/style/noNonNullAssertion: this is a required option
		opts.blocks.indexOf(id)! >= 0 &&
			editor.Blocks.add(id, {
				select: true,
				...def,
				...opts.block(id),
			});
	};

	const { tabsBlock, typeTabs } = opts.tabOptions as RequiredTabsOptions;

	if (tabsBlock) {
		addBlock(typeTabs, {
			media: `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 9.3c0-.8-.5-1.3-1.3-1.3H3.4C2.5 8 2 8.5 2 9.3v7.4c0 .8.5 1.3 1.3 1.3h17.4c.8 0 1.3-.5 1.3-1.3V9.3zM21 17H3V9h18v8z" fill-rule="nonzero"/><rect x="3" y="5" width="4" height="2" rx=".5"/><rect x="8" y="5" width="4" height="2" rx=".5"/><rect x="13" y="5" width="4" height="2" rx=".5"/>
        </svg>
      `,
			label: 'Tabs',
			content: { type: typeTabs },
			category: 'Extra',
		});
	}
};
