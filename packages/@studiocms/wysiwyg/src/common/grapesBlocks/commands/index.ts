import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { CommandDefinitionById, Editor, ObjectAny } from 'grapesjs';
import type { RequiredCustomCodeOptions, RequiredGrapesBlocksOptions } from '../types.js';
import clear from './clear.js';
import customCodeCommands from './customCodeCommands.js';
import deviceCommands from './deviceCommands.js';
import openImport from './openImport.js';

export const AddCmd =
	(editor: Editor) =>
		// biome-ignore lint/complexity/noBannedTypes: just working with GrapesJS types here
		<const TId extends string, T extends ObjectAny = {}>(id: TId, command: CommandDefinitionById<TId, T>) => {
			editor.Commands.add(id, command);
		};

export function loadCommands(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	clear(editor, opts);
	openImport(editor, opts);
	deviceCommands(editor);
	customCodeCommands(editor, opts.customCode as RequiredCustomCodeOptions);

	AddCmd(editor)('save-page', {
		run: async (editor, sender) => {
			sender?.set('active', 0);
			try {
				await editor.store();
				toast({
					title: 'WYSIWYG: Manually Saved Page',
					description:
						"Your editor changes have been saved. Don't forget to save your changes in StudioCMS!",
					type: 'info',
					duration: 3000,
				});
			} catch (e) {
				toast({
					title: 'WYSIWYG: Save failed',
					description: String(e),
					type: 'danger',
				});
			}
		},
	});
}

export default loadCommands;
