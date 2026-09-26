import type { FolderNode } from 'studiocms:sdk/types';

interface BaseProps {
	depth?: number;
	createFolderLink?: string;
	createPageLink?: string;
	editFolderLink?: string;
	editPageLink?: string;
}

export interface NodeLeafProps extends BaseProps {
	node: FolderNode;
}

export interface TreeProps extends BaseProps {
	data: FolderNode[];
}
