import type { ComponentDefinition } from 'grapesjs';

export interface TabsOptions {
	// Block and props settings
	tabsBlock?: ComponentDefinition | null;
	tabsProps?: ComponentDefinition;
	tabContainerProps?: ComponentDefinition;
	tabProps?: ComponentDefinition;
	tabContentProps?: ComponentDefinition;
	tabContentsProps?: ComponentDefinition;

	// Class names
	classTab: string;
	classTabContainer: string;
	classTabActive: string;
	classTabContent: string;
	classTabContents: string;

	// Selectors and types
	selectorTab: string;
	typeTabs: string;
	typeTabContainer: string;
	typeTab: string;
	typeTabContent: string;
	typeTabContents: string;

	// Templates
	templateTab: TabTemplate;
	templateTabContent?: TabTemplate;
	style?: (config: TabsOptions) => string;
}

export interface TabTemplateProps {
	index: number;
}

export type TabTemplate = string | ((props: TabTemplateProps) => string);

export interface TabConfig {
	selectorTab: string;
	typeTab: string;
	typeTabContainer: string;
	classTab: string;
	classTabActive: string;
	typeTabs: string;
	templateTab: TabTemplate;
	typeTabContent: string;
	templateTabContent?: TabTemplate;
	tabProps?: ComponentDefinition;
}

export interface TabContainerConfig {
	typeTabContainer: string;
	typeTabs: string;
	typeTab: string;
	classTabContainer: string;
	tabContainerProps?: ComponentDefinition;
}

export interface TabContentConfig {
	typeTabContent: string;
	classTabContent: string;
	tabContentProps?: ComponentDefinition;
}

export interface TabContentsConfig {
	typeTabContents: string;
	classTabContents: string;
	tabContentsProps?: ComponentDefinition;
}

export interface TabsConfig {
	typeTabs: string;
	typeTab: string;
	typeTabContent: string;
	typeTabContents: string;
	typeTabContainer: string;
	classTabActive: string;
	selectorTab: string;
	tabsProps?: ComponentDefinition;
	style?: (config: TabsOptions) => string;
}

export interface TabComponentProps {
	classactive: string;
	selectortab: string;
}

export interface TabAttributes {
	role?: string;
	id?: string;
	'aria-labelledby'?: string;
	hidden?: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	[key: string]: any;
}

export interface CustomWindow extends Window {
	_isEditor?: boolean;
}
