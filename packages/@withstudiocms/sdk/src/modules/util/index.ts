import { Effect } from '@withstudiocms/effect';
import { SDKFolderTree as FolderTree } from './folderTree.js';
import { SDKGenerators as Generators } from './generators.js';
import { GetVersionFromNPM } from './getVersionFromNPM.js';
import { SDKParsers as Parsers } from './parsers.js';
import { SDKUsers as Users } from './users.js';

const placeholder = Effect.succeed({});

/**
 * SDK Util Module
 *
 * This module aggregates various utility functionalities of the SDK.
 */
export const SDKUtilModule = Effect.all({
	Collectors: placeholder,
	FolderTree,
	Generators,
	GetVersionFromNPM,
	Parsers,
	Users,
});
