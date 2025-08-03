import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { CommandFunction, CommandObject, Editor, ObjectAny } from 'grapesjs';
import { cmdClear, cmdDeviceDesktop, cmdDeviceMobile, cmdDeviceTablet } from '../consts.js';
import type { RequiredGrapesBlocksOptions } from '../types.js';
import openImport from './openImport.js';

export function loadCommands(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	const { Commands } = editor;
	const txtConfirm = opts.textCleanCanvas;

	// biome-ignore lint/suspicious/noExplicitAny: this is the source type used by grapesjs
	const addCmd = <T extends ObjectAny>(id: string, command: CommandFunction | CommandObject<any, T>) => {
		Commands.add(id, command);
	};

	openImport(editor, opts);

	addCmd(cmdDeviceDesktop, {
		run: (ed) => ed.setDevice('Desktop'),
		stop: () => {},
	});
	addCmd(cmdDeviceTablet, {
		run: (ed) => ed.setDevice('Tablet'),
		stop: () => {},
	});
	addCmd(cmdDeviceMobile, {
		run: (ed) => ed.setDevice('Mobile portrait'),
		stop: () => {},
	});
    addCmd(cmdClear, (e: Editor) => {
        if (confirm(txtConfirm)) {
            e.runCommand("core:canvas-clear");
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
