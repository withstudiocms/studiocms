export type SidebarGroup =
	| SidebarManualGroup
	| {
			autogenerate: {
				collapsed?: boolean;
				directory: string;
			};
			collapsed?: boolean;
			label: string;
	  };

interface SidebarManualGroup {
	collapsed?: boolean;
	items: (LinkItem | SidebarGroup)[];
	label: string;
	badge?:
		| string
		| {
				text: string;
				variant: 'note' | 'danger' | 'success' | 'caution' | 'tip' | 'default';
		  }
		| undefined;
}

interface LinkItem {
	label: string;
	link: string;
}
