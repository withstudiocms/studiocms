import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { CommandFunction, CommandObject, Editor, ObjectAny } from 'grapesjs';
import type { RequiredCustomCodeOptions, RequiredGrapesBlocksOptions } from '../types.js';
import clear from './clear.js';
import customCodeCommands from './customCodeCommands.js';
import deviceCommands from './deviceCommands.js';
import openImport from './openImport.js';

export const AddCmd =
	(editor: Editor) =>
	<T extends ObjectAny>(
		id: string,
		// biome-ignore lint/suspicious/noExplicitAny: this is the source type used by grapesjs
		command: CommandFunction | CommandObject<any, T>
	) => {
		editor.Commands.add(id, command);
	};

export function loadCommands(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	clear(editor, opts);
	openImport(editor, opts);
	deviceCommands(editor);
	customCodeCommands(editor, opts.customCode as RequiredCustomCodeOptions);

	AddCmd(editor)('save-page', {
		run: (editor, sender) => {
   			sender?.set('active', 0);
			editor.store();
			toast({
				title: 'Page saved',
				description: 'Your changes have been saved successfully.',
				type: 'success',
				duration: 3000,
			});
		},
	});
}

export default loadCommands;
