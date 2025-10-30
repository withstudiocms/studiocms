import { Effect } from '@withstudiocms/effect';
import { SDKCollectors as Collectors } from './collectors.js';
import { SDKFolderTree as FolderTree } from './folderTree.js';
import { SDKGenerators as Generators } from './generators.js';
import { GetFromNPM } from './getFromNPM.js';
import { SDKParsers as Parsers } from './parsers.js';
import { SDKUsers as Users } from './users.js';

/**
 * SDK Util Module
 *
 * This module aggregates various utility functionalities of the SDK.
 */
export const SDKUtilModule = Effect.all({
	Collectors,
	FolderTree,
	Generators,
	GetFromNPM,
	Parsers,
	Users,
});
