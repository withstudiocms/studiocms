import type { TabTemplate, TabTemplateProps, TabsOptions } from './types.js';

const defaultStyle = (config: TabsOptions): string => `
  .${config.classTab} {
    padding: 7px 14px;
    display: inline-block;
    border-radius: 3px;
    margin-right: 10px;
  }

  .${config.classTab}:focus {
    outline: none;
  }

  .${config.classTab}.${config.classTabActive} {
    background-color: #0d94e6;
    color: white;
  }

  .${config.classTabContainer} {
    display: inline-block;
  }

  .${config.classTabContent} {
    animation: fadeEffect 1s;
  }

  .${config.classTabContents} {
    min-height: 100px;
    padding: 10px;
  }

  @keyframes fadeEffect {
    from {opacity: 0;}
    to {opacity: 1;}
  }
`;

const defaultOptions: TabsOptions = {
	// Block settings
	tabsBlock: {},
	tabsProps: {},
	tabContainerProps: {},
	tabProps: {},
	tabContentProps: {},
	tabContentsProps: {},

	// Class names
	classTab: 'tab',
	classTabContainer: 'tab-container',
	classTabActive: 'tab-active',
	classTabContent: 'tab-content',
	classTabContents: 'tab-contents',

	// Selectors and types
	selectorTab: 'aria-controls',
	typeTabs: 'tabs',
	typeTabContainer: 'tab-container',
	typeTab: 'tab',
	typeTabContent: 'tab-content',
	typeTabContents: 'tab-contents',

	// Templates
	templateTab: ({ index }) => `<span data-gjs-highlightable="false">Tab ${index}</span>`,
	templateTabContent: ({ index }) => `<div>Tab Content ${index}</div>`,

	// Style
	style: defaultStyle,
};

export const resolveTemplate = (
	template: TabTemplate | undefined,
	props: TabTemplateProps
): string | undefined => {
	if (!template) {
		return undefined;
	}

	if (typeof template === 'function') {
		return template(props);
	}
	return template;
};

export const mergeStyles = (userStyle?: (config: TabsOptions) => string) => {
	return userStyle || defaultStyle;
};

export default defaultOptions;
