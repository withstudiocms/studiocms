import type { FolderNode, tsPageFolderSelect } from '../types/index.js';

/**
 * Builds a folder structure from the provided folder data.
 *
 * @param folders - An array of folder data to build the folder structure from.
 * @returns An array of folder nodes representing the folder structure.
 */
export function generateFolderTree(folders: tsPageFolderSelect[]): FolderNode[] {
	const folderMap: Record<string, FolderNode> = {};

	for (const folder of folders) {
		folderMap[folder.id] = {
			id: folder.id,
			name: folder.name,
			pageData: null,
			page: false,
			children: [],
		};
	}

	const rootFolders: FolderNode[] = [];

	for (const folder of folders) {
		const childFolder = folderMap[folder.id];
		if (!childFolder) continue;

		if (folder.parent === null) {
			rootFolders.push(childFolder);
		} else {
			const parentFolder = folderMap[folder.parent];
			if (parentFolder) {
				parentFolder.children.push(childFolder);
			}
		}
	}

	return rootFolders;
}

/**
 * Finds a node in the tree that matches the given URL path.
 * @param tree - The root of the folder tree.
 * @param path - The URL path to locate.
 * @returns The matching node or null if not found.
 */
export function findNodeByPath(tree: FolderNode[], path: string[]): FolderNode | null {
	if (path.length === 0) return null;

	const [current, ...rest] = path;

	for (const node of tree) {
		if (node.name === current) {
			if (rest.length === 0) return node;
			return findNodeByPath(node.children, rest);
		}
	}

	return null;
}

/**
 * Finds all nodes along the path to a specific node by its ID.
 * @param tree - The root of the folder tree.
 * @param id - The ID of the target node.
 * @returns An array of nodes along the path or an empty array if the node is not found.
 */
export function findNodesAlongPathToId(tree: FolderNode[], id: string): FolderNode[] {
	const path: FolderNode[] = [];

	function helper(nodes: FolderNode[], targetId: string): boolean {
		for (const node of nodes) {
			path.push(node); // Add the current node to the path

			if (node.id === targetId) {
				return true; // Target found, stop recursion
			}

			if (helper(node.children, targetId)) {
				return true; // Target found in descendants, propagate success
			}

			path.pop(); // Backtrack if target is not found in this branch
		}

		return false; // Target not found in this branch
	}

	helper(tree, id);
	return path;
}

/**
 * Finds the full path to a node based on its URL.
 * @param tree - The root of the folder tree.
 * @param path - The URL path to locate.
 * @returns The full path as an array of node names.
 */
export function getFullPath(tree: FolderNode[], path: string[]): string[] {
	const result: string[] = [];

	function helper(nodes: FolderNode[], pathParts: string[]): boolean {
		if (pathParts.length === 0) return false;

		const [current, ...rest] = pathParts;

		for (const node of nodes) {
			if (node.name === current) {
				result.push(node.name);
				if (rest.length === 0 || helper(node.children, rest)) {
					return true;
				}
				result.pop(); // Backtrack if not found
			}
		}

		return false;
	}

	helper(tree, path);
	return result;
}

/**
 * Finds all nodes along the path to a given URL.
 * @param tree - The root of the folder tree.
 * @param path - The URL path to locate.
 * @returns The nodes along the path.
 */
export function findNodesAlongPath(tree: FolderNode[], path: string[]): FolderNode[] {
	const result: FolderNode[] = [];

	function helper(nodes: FolderNode[], pathParts: string[]): boolean {
		if (pathParts.length === 0) return false;

		const [current, ...rest] = pathParts;

		for (const node of nodes) {
			if (node.name === current) {
				result.push(node);
				if (rest.length === 0 || helper(node.children, rest)) {
					return true;
				}
				result.pop(); // Backtrack if not found
			}
		}

		return false;
	}

	helper(tree, path);
	return result;
}

/**
 * Finds a node by its ID in the tree.
 * @param id - The ID of the node to find.
 * @returns The node or null if not found.
 */
export function findNodeById(tree: FolderNode[], id: string): FolderNode | null {
	for (const node of tree) {
		if (node.id === id) {
			return node;
		}
		const found = findNodeById(node.children, id);
		if (found) {
			return found;
		}
	}
	return null;
}

/**
 * Adds a new page to the folder tree.
 * @param tree - The root of the folder tree.
 * @param folderId - The ID of the parent folder.
 * @param newPage - The new page to add.
 * @returns The updated folder tree
 */
export function addPageToFolderTree(
	tree: FolderNode[],
	folderId: string,
	newPage: FolderNode
): FolderNode[] {
	const parentFolder = findNodeById(tree, folderId);

	if (!parentFolder) {
		tree.push(newPage);
		return tree;
	}

	parentFolder.children.push(newPage);
	return tree;
}
