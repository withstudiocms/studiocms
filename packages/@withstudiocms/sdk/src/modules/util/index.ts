import { Effect } from '@withstudiocms/effect';
import { SDKFolderTree as FolderTree } from './folderTree.js';
import { SDKGenerators as Generators } from './generators.js';
import { GetVersionFromNPM } from './getVersionFromNPM.js';

export const SDKUtilModule = Effect.all({
	FolderTree,
	Generators,
	GetVersionFromNPM,
});
