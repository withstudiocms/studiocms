import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { CommandFunction, CommandObject, Editor, ObjectAny } from 'grapesjs';
import { cmdClear } from '../consts.js';
import type { RequiredGrapesBlocksOptions } from '../types.js';

export default (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	const { Commands } = editor;

	const addCmd = <T extends ObjectAny>(
		id: string,
		// biome-ignore lint/suspicious/noExplicitAny: this is the source type used by grapesjs
		command: CommandFunction | CommandObject<any, T>
	) => {
		Commands.add(id, command);
	};

	const txtConfirm = opts.textCleanCanvas;

	addCmd(cmdClear, (e: Editor) => {
		if (confirm(txtConfirm)) {
			e.runCommand('core:canvas-clear');
			toast({
				title: 'Canvas Cleared',
				type: 'success',
				description: 'The canvas has been cleared successfully.',
				duration: 5000,
			});
		}
	});
};
