import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { Editor } from 'grapesjs';
import { cmdClear, cmdDeviceDesktop, cmdDeviceMobile, cmdDeviceTablet } from '../consts.js';
import type { RequiredGrapesBlocksOptions } from '../types.js';
import openImport from './openImport.js';

export function loadCommands(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	const { Commands } = editor;
	const txtConfirm = opts.textCleanCanvas;

	openImport(editor, opts);

	Commands.add(cmdDeviceDesktop, {
		run: (ed) => ed.setDevice('Desktop'),
		stop: () => {},
	});
	Commands.add(cmdDeviceTablet, {
		run: (ed) => ed.setDevice('Tablet'),
		stop: () => {},
	});
	Commands.add(cmdDeviceMobile, {
		run: (ed) => ed.setDevice('Mobile portrait'),
		stop: () => {},
	});
	Commands.add(cmdClear, (e: Editor) => confirm(txtConfirm) && e.runCommand('core:canvas-clear'));

    // Update canvas-clear command
    Commands.add(cmdClear, () => {
        if (confirm("Are you sure to clean the canvas?")) {
            editor.runCommand("core:canvas-clear");
            toast({
                title: "Canvas Cleared",
                type: "success",
                description: "The canvas has been cleared successfully.",
                duration: 5000,
            });
        }
    });
}

export default loadCommands;
