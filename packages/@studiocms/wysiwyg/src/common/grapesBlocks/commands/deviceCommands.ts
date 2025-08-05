import type { Editor } from 'grapesjs';
import { cmdDeviceDesktop, cmdDeviceMobile, cmdDeviceTablet } from '../consts';
import { AddCmd } from './index.js';

export default (editor: Editor) => {
	const addCmd = AddCmd(editor);

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
};
