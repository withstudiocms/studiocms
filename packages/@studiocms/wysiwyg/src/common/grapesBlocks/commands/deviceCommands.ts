import type { CommandFunction, CommandObject, Editor, ObjectAny } from "grapesjs";
import { cmdDeviceDesktop, cmdDeviceMobile, cmdDeviceTablet } from "../consts";

export default (editor: Editor) => {
	const { Commands } = editor;
    const addCmd = <T extends ObjectAny>(
        id: string,
        // biome-ignore lint/suspicious/noExplicitAny: this is the source type used by grapesjs
        command: CommandFunction | CommandObject<any, T>
    ) => {
        Commands.add(id, command);
    };

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
}