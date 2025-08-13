import { Effect } from '../../effect.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsPageFolderStructure } from '../tables.js';
import type { FolderListItem, FolderNode, tsPageFolderSelect } from '../types/index.js';
import { AstroDB, type LibSQLDatabaseError } from './db.js';

/**
 * Service class for managing and manipulating folder trees in the StudioCMS SDK.
 *
 * Provides methods to:
 * - Build a folder tree structure from raw folder data.
 * - Find nodes and paths within the folder tree by name or ID.
 * - Add new pages to the folder tree.
 * - Retrieve folder structures and lists from the database.
 *
 * @remarks
 * All methods are effectful and return `Effect.Effect` instances for error handling and composability.
 *
 * @example
 * ```typescript
 * const folderTreeService = SDKCore_FolderTree;
 * const tree = yield* folderTreeService.buildFolderTree;
 * ```
 *
 * @see FolderNode
 * @see SDKCoreError
 * @see Effect
 */
export class SDKCore_FolderTree extends Effect.Service<SDKCore_FolderTree>()(
	'studiocms/sdk/SDKCore_FolderTree',
	{
		effect: Effect.gen(function* () {
			const dbService = yield* AstroDB;

			/**
			 * Builds a folder structure from the provided folder data.
			 *
			 * @param folders - An array of folder data to build the folder structure from.
			 * @returns An array of folder nodes representing the folder structure.
			 */
			const generateFolderTree = (
				folders: tsPageFolderSelect[]
			): Effect.Effect<FolderNode[], SDKCoreError, never> =>
				Effect.try({
					try: () => {
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
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`GenerateFolderTree Error: ${error}`),
						}),
				});

			/**
			 * Finds the full path to a node based on its URL.
			 * @param tree - The root of the folder tree.
			 * @param path - The URL path to locate.
			 * @returns The full path as an array of node names.
			 */
			const getFullPath = (
				tree: FolderNode[],
				path: string[]
			): Effect.Effect<string[], SDKCoreError, never> =>
				Effect.try({
					try: () => {
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
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`getFullPath Error: ${error}`),
						}),
				});

			/**
			 * Finds a node in the tree that matches the given URL path.
			 * @param tree - The root of the folder tree.
			 * @param path - The URL path to locate.
			 * @returns The matching node or null if not found.
			 */
			const findNodeByPath = (
				tree: FolderNode[],
				path: string[]
			): Effect.Effect<FolderNode | null, SDKCoreError, never> =>
				Effect.try({
					try: () => {
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
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`FindNodeByPath Error: ${error}`),
						}),
				});

			/**
			 * Finds all nodes along the path to a given URL.
			 * @param tree - The root of the folder tree.
			 * @param path - The URL path to locate.
			 * @returns The nodes along the path.
			 */
			const findNodesAlongPath = (
				tree: FolderNode[],
				path: string[]
			): Effect.Effect<FolderNode[], SDKCoreError, never> =>
				Effect.try({
					try: () => {
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
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`FindNodesAlongPath Error: ${error}`),
						}),
				});

			/**
			 * Finds all nodes along the path to a specific node by its ID.
			 * @param tree - The root of the folder tree.
			 * @param id - The ID of the target node.
			 * @returns An array of nodes along the path or an empty array if the node is not found.
			 */
			const findNodesAlongPathToId = (tree: FolderNode[], id: string) =>
				Effect.try({
					try: () => {
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
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`FindNodesAlongPathToId Error: ${error}`),
						}),
				});

			/**
			 * Finds a node by its ID in the tree.
			 * @param id - The ID of the node to find.
			 * @returns The node or null if not found.
			 */
			const findNodeById = (tree: FolderNode[], id: string) =>
				Effect.try({
					try: () => {
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
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`findNodeById Error: ${error}`),
						}),
				});

			/**
			 * Adds a new page to the folder tree.
			 * @param tree - The root of the folder tree.
			 * @param folderId - The ID of the parent folder.
			 * @param newPage - The new page to add.
			 * @returns The updated folder tree
			 */
			const addPageToFolderTree = (tree: FolderNode[], folderId: string, newPage: FolderNode) =>
				Effect.gen(function* () {
					const parentFolder = yield* findNodeById(tree, folderId);

					if (!parentFolder) {
						tree.push(newPage);
						return tree;
					}

					parentFolder.children.push(newPage);
					return tree;
				});

			/**
			 * Gets the folder structure from the database.
			 *
			 * @returns A promise that resolves to an array of folder nodes representing the folder structure.
			 */
			const buildFolderTree: Effect.Effect<
				FolderNode[],
				LibSQLDatabaseError | SDKCoreError,
				never
			> = Effect.gen(function* () {
				const currentFolders = yield* dbService.execute((db) =>
					db.select().from(tsPageFolderStructure)
				);
				return yield* generateFolderTree(currentFolders);
			});

			/**
			 * Gets the available folders from the database.
			 *
			 * @returns A promise that resolves to an array of folder list items.
			 */
			const getAvailableFolders: Effect.Effect<FolderListItem[], LibSQLDatabaseError, never> =
				Effect.gen(function* () {
					const folders: FolderListItem[] = [];

					const currentFolders = yield* dbService.execute((db) =>
						db.select().from(tsPageFolderStructure)
					);

					for (const current of currentFolders) {
						folders.push(current);
					}
					return folders;
				});

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
		}),
		dependencies: [AstroDB.Default],
	}
) {}
