import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { Editor } from 'grapesjs';
import { cmdClear } from '../consts.js';
import type { RequiredGrapesBlocksOptions } from '../types.js';
import { AddCmd } from './index.js';

export default (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	const addCmd = AddCmd(editor);

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
