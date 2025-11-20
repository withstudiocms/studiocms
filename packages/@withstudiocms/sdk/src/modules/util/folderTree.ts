import { Data, Effect, Schema } from '@withstudiocms/effect';
import { StudioCMSPageFolderStructure } from '@withstudiocms/kysely';
import { DBClientLive } from '../../context.js';
import type { FolderListItem, FolderNode, tsPageFolderSelect } from '../../types.js';

/**
 * Custom error class for folder tree related errors.
 */
export class FolderTreeError extends Data.TaggedError('FolderTreeError')<{ cause: unknown }> {}

/**
 * Utility function to wrap operations with FolderTreeError handling.
 *
 * @param _try - A function that performs the operation to be wrapped.
 * @returns An Effect that either yields the result of the operation or a FolderTreeError.
 */
const useFolderTreeError = <T>(_try: () => T) =>
	Effect.try({
		try: _try,
		catch: (error) => new FolderTreeError({ cause: error }),
	});

/**
 * SDKFolderTree
 *
 * An Effect.Gen that provides utilities for constructing and querying an in-memory folder tree
 * representation derived from the StudioCMSPageFolderStructure table.
 *
 * This effect:
 * - Fetches the current folder records from the database using DBClientLive and a typed decoder.
 * - Exposes pure and effectful helper functions for building a hierarchical tree, searching nodes
 *   by path or id, and adding page nodes to the tree.
 *
 * Exposed functions and behavior:
 * - generateFolderTree(folders: readonly tsPageFolderSelect[]): FolderNode[]
 *   Builds a hierarchical FolderNode[] from a flat list of folder records. Each FolderNode
 *   contains id, name, pageData, page (boolean), and children (FolderNode[]).
 *
 * - getFullPath(tree: FolderNode[], path: string[]): string[]
 *   Returns the sequence of folder names from the root down to the specified path of folder names.
 *   If the supplied path is not found, returns the longest matched prefix (or an empty array).
 *
 * - findNodeByPath(tree: FolderNode[], path: string[]): FolderNode | null
 *   Locates and returns the FolderNode that exactly matches the supplied path of folder names.
 *   Returns null if the full path does not exist.
 *
 * - findNodesAlongPath(tree: FolderNode[], path: string[]): FolderNode[]
 *   Returns the array of FolderNode objects encountered along the specified path of names.
 *   Useful for obtaining each node in the chain (root → ... → target). Returns an empty array
 *   when no match is found.
 *
 * - findNodesAlongPathToId(tree: FolderNode[], id: string): FolderNode[]
 *   Searches the tree for a node by id and returns all FolderNode objects along the path from
 *   the root to that node. If the id is not found, an empty array is returned.
 *
 * - findNodeById(tree: FolderNode[], id: string): FolderNode | null
 *   Recursively searches and returns the FolderNode with the matching id, or null when not found.
 *
 * - addPageToFolderTree(tree: FolderNode[], folderId: string, newPage: FolderNode): FolderNode[]
 *   Effectful helper that inserts a new page node under the folder with folderId. If no folder
 *   with folderId exists, the newPage is appended at the root level. Returns the updated tree.
 *
 * - buildFolderTree: Effect<unknown, Error, FolderNode[]>
 *   Effect that fetches current folders from the DB and maps them to a hierarchical tree using
 *   generateFolderTree.
 *
 * - getAvailableFolders: Effect<unknown, Error, FolderListItem[]>
 *   Effect that fetches current folders from the DB and returns a light-weight list of folder
 *   descriptors { id, name, parent } for UI lists or selection controls.
 *
 * Notes and guarantees:
 * - All helpers wrap their logic in a folder-tree specific error boundary via useFolderTreeError,
 *   so callers receive consistent errors for tree operations.
 * - The internal representation assumes unique folder ids and uses the parent id to assemble
 *   the hierarchy; folders with a null/undefined parent are treated as root nodes.
 * - The effect depends on DBClientLive and a decoder for StudioCMSPageFolderStructure to ensure
 *   type-safe database reads.
 *
 * @remarks
 * Intended for use by SDK consumers that need to present, navigate, or mutate a folder hierarchy
 * derived from persistent storage. Consumers should treat returned FolderNode[] as a mutable
 * structure when using addPageToFolderTree; other helpers are pure and deterministic.
 *
 * @returns An Effect that yields an object exposing the functions described above for building
 *          and querying folder trees.
 */
export const SDKFolderTree = Effect.gen(function* () {
	const { withDecoder } = yield* DBClientLive;

	/**
	 * Fetches the current folder structures from the database.
	 *
	 * @returns An array of folder structures.
	 * @internal
	 * @private
	 */
	const _getCurrentFolders = withDecoder({
		decoder: Schema.Array(StudioCMSPageFolderStructure.Select),
		callbackFn: (query) =>
			query((db) => db.selectFrom('StudioCMSPageFolderStructure').selectAll().execute()),
	});

	/**
	 * Generates a folder tree structure from a flat list of folder data.
	 *
	 * @param folders - An array of folder data to build the folder structure from.
	 * @returns An array of folder nodes representing the folder structure.
	 */
	const generateFolderTree = Effect.fn((folders: readonly tsPageFolderSelect[]) =>
		useFolderTreeError(() => {
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

				if (folder.parent === null || folder.parent === undefined) {
					rootFolders.push(childFolder);
				} else {
					const parentFolder = folderMap[folder.parent];
					if (parentFolder) {
						parentFolder.children.push(childFolder);
					}
				}
			}

			return rootFolders;
		})
	);

	/**
	 * Retrieves the full path of folder names leading to a specified path.
	 *
	 * @param tree - The folder tree to search within.
	 * @param path - An array of folder names representing the target path.
	 * @returns An array of folder names representing the full path.
	 */
	const getFullPath = Effect.fn((tree: FolderNode[], path: string[]) =>
		useFolderTreeError(() => {
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
		})
	);

	/**
	 * Finds a node in the folder tree based on a specified path.
	 *
	 * @param tree - The folder tree to search within.
	 * @param path - An array of folder names representing the target path.
	 * @returns The folder node if found, otherwise null.
	 */
	const findNodeByPath = Effect.fn((tree: FolderNode[], path: string[]) =>
		useFolderTreeError(() => {
			function _findNodeByPath(tree: FolderNode[], path: string[]): FolderNode | null {
				if (path.length === 0) return null;

				const [current, ...rest] = path;

				for (const node of tree) {
					if (node.name === current) {
						if (rest.length === 0) return node;
						return _findNodeByPath(node.children, rest);
					}
				}

				return null;
			}

			return _findNodeByPath(tree, path);
		})
	);

	/**
	 * Finds all nodes along a specified path in the folder tree.
	 *
	 * @param tree - The folder tree to search within.
	 * @param path - An array of folder names representing the target path.
	 * @returns An array of folder nodes along the specified path.
	 */
	const findNodesAlongPath = Effect.fn((tree: FolderNode[], path: string[]) =>
		useFolderTreeError(() => {
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
		})
	);

	/**
	 * Finds all nodes along the path to a specific node by its ID.
	 *
	 * @param tree - The root of the folder tree.
	 * @param id - The ID of the target node.
	 * @returns An array of nodes along the path or an empty array if the node is not found.
	 */
	const findNodesAlongPathToId = Effect.fn((tree: FolderNode[], id: string) =>
		useFolderTreeError(() => {
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
		})
	);

	/**
	 * Finds a node in the folder tree by its ID.
	 *
	 * @param tree - The folder tree to search within.
	 * @param id - The ID of the target node.
	 * @returns The folder node if found, otherwise null.
	 */
	const findNodeById = Effect.fn((tree: FolderNode[], id: string) =>
		useFolderTreeError(() => {
			function _findNodeById(tree: FolderNode[], id: string): FolderNode | null {
				for (const node of tree) {
					if (node.id === id) {
						return node;
					}
					const found = _findNodeById(node.children, id);
					if (found) {
						return found;
					}
				}
				return null;
			}

			return _findNodeById(tree, id);
		})
	);

	/**
	 * Adds a new page to the folder tree under the specified folder ID.
	 *
	 * @param tree - The folder tree to add the page to.
	 * @param folderId - The ID of the folder to add the page under.
	 * @param newPage - The new page node to be added.
	 * @returns The updated folder tree.
	 */
	const addPageToFolderTree = Effect.fn(function* (
		tree: FolderNode[],
		folderId: string,
		newPage: FolderNode
	) {
		const parentFolder = yield* findNodeById(tree, folderId);

		if (!parentFolder) {
			tree.push(newPage);
			return tree;
		}

		parentFolder.children.push(newPage);
		return tree;
	});

	/**
	 * Builds the folder tree from the current folders.
	 *
	 * @returns The root of the folder tree.
	 */
	const buildFolderTree = _getCurrentFolders().pipe(Effect.flatMap(generateFolderTree));

	/**
	 * Retrieves a list of available folders with their IDs, names, and parent IDs.
	 *
	 * @returns An array of folder list items.
	 */
	const getAvailableFolders = _getCurrentFolders().pipe(
		Effect.map((folders) =>
			folders.map(
				(folder) =>
					({
						id: folder.id,
						name: folder.name,
						parent: folder.parent,
					}) as FolderListItem
			)
		)
	);

	return {
		generateFolderTree,
		getFullPath,
		findNodeByPath,
		findNodesAlongPath,
		findNodesAlongPathToId,
		findNodeById,
		addPageToFolderTree,
		buildFolderTree,
		getAvailableFolders,
	};
});
