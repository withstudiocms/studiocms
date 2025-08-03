import type { Editor } from 'grapesjs';
import type { RequiredCustomCodeOptions, RequiredGrapesBlocksOptions } from '../types.js';
import clear from './clear.js';
import customCodeCommands from './customCodeCommands.js';
import deviceCommands from './deviceCommands.js';
import openImport from './openImport.js';

export function loadCommands(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	clear(editor, opts);
	openImport(editor, opts);
	deviceCommands(editor);
	customCodeCommands(editor, opts.customCode as RequiredCustomCodeOptions);
}

export default loadCommands;
