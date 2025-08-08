import type { Editor } from 'grapesjs';
import {
	cmdClear,
	cmdDeviceDesktop,
	cmdDeviceMobile,
	cmdDeviceTablet,
	cmdImport,
	exportTemplate,
} from '../consts.js';
import type { RequiredGrapesBlocksOptions } from '../types.js';

export function loadPanels(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	const { Panels } = editor;
	const config = editor.getConfig();
	const osm = 'open-sm';
	const otm = 'open-tm';
	const ola = 'open-layers';
	const obl = 'open-blocks';
	const iconStyle = 'style="display: block; max-width:22px"';

	config.showDevices = false;

	Panels.getPanels().reset([
		{
			id: 'commands',
			buttons: [{}],
		},
		{
			id: 'devices-c',
			buttons: [
				{
					id: cmdDeviceDesktop,
					command: cmdDeviceDesktop,
					active: true,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
                <path fill="currentColor" d="M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z" />
            </svg>`,
				},
				{
					id: cmdDeviceTablet,
					command: cmdDeviceTablet,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
                <path fill="currentColor" d="M19,18H5V6H19M21,4H3C1.89,4 1,4.89 1,6V18A2,2 0 0,0 3,20H21A2,2 0 0,0 23,18V6C23,4.89 22.1,4 21,4Z" />
            </svg>`,
				},
				{
					id: cmdDeviceMobile,
					command: cmdDeviceMobile,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
                <path fill="currentColor" d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" />
            </svg>`,
				},
			],
		},
		{
			id: 'options',
			buttons: [
				{
					id: 'undo',
					command: () => editor.runCommand('core:undo'),
					label: `<svg ${iconStyle} title="Undo" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20 13.5C20 17.09 17.09 20 13.5 20H6V18H13.5C16 18 18 16 18 13.5S16 9 13.5 9H7.83L10.91 12.09L9.5 13.5L4 8L9.5 2.5L10.92 3.91L7.83 7H13.5C17.09 7 20 9.91 20 13.5Z" />
            </svg>`,
				},
				{
					id: 'redo',
					command: () => editor.runCommand('core:redo'),
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
                <path fill="currentColor" d="M10.5 18H18V20H10.5C6.91 20 4 17.09 4 13.5S6.91 7 10.5 7H16.17L13.08 3.91L14.5 2.5L20 8L14.5 13.5L13.09 12.09L16.17 9H10.5C8 9 6 11 6 13.5S8 18 10.5 18Z" />
            </svg>`,
				},
				{
					id: cmdImport,
					command: () => editor.runCommand(cmdImport),
					label: `<svg ${iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">  <path fill-rule="evenodd" d="M9.75 6.75h-3a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3h7.5a3 3 0 0 0 3-3v-7.5a3 3 0 0 0-3-3h-3V1.5a.75.75 0 0 0-1.5 0v5.25Zm0 0h1.5v5.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V6.75Z" clip-rule="evenodd" /><path d="M7.151 21.75a2.999 2.999 0 0 0 2.599 1.5h7.5a3 3 0 0 0 3-3v-7.5c0-1.11-.603-2.08-1.5-2.599v7.099a4.5 4.5 0 0 1-4.5 4.5H7.151Z" /></svg>`,
				},
				{
					id: exportTemplate,
					command: () => editor.runCommand(exportTemplate),
					label: `<svg ${iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M9.97.97a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72v3.44h-1.5V3.31L8.03 5.03a.75.75 0 0 1-1.06-1.06l3-3ZM9.75 6.75v6a.75.75 0 0 0 1.5 0v-6h3a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3h3Z" /><path d="M7.151 21.75a2.999 2.999 0 0 0 2.599 1.5h7.5a3 3 0 0 0 3-3v-7.5c0-1.11-.603-2.08-1.5-2.599v7.099a4.5 4.5 0 0 1-4.5 4.5H7.151Z" /></svg>`,
				},
				{
					id: cmdClear,
					command: () => editor.runCommand(cmdClear),
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
              </svg>`,
				},
				{
					id: 'fullscreen',
					command: 'core:fullscreen',
					label: `<svg ${iconStyle} viewBox="0 0 24 24" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" ><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
				},
				{
					id: 'save',
					command: 'save-page',
					label: `<svg ${iconStyle} fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="save-indicator"><path fill="none" stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z" /><circle cx="20" cy="18" r="4" fill="#ef4444" stroke="white" stroke-width="0.5" class="dirty-indicator" style="display: none;" /></svg>`,
				}
			],
		},
		{
			id: 'views',
			buttons: [
				{
					id: osm,
					command: osm,
					active: true,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
                <path fill="currentColor" d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z" />
            </svg>`,
				},
				{
					id: otm,
					command: otm,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
          </svg>`,
				},
				{
					id: ola,
					command: ola,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z" />
          </svg>`,
				},
				{
					id: obl,
					command: obl,
					label: `<svg ${iconStyle} viewBox="0 0 24 24">
              <path fill="currentColor" d="M17,13H13V17H11V13H7V11H11V7H13V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
          </svg>`,
				},
			],
		},
	]);

	// Add and beautify tooltips
	[
		['sw-visibility', 'Show Borders'],
		['preview', 'Preview'],
		['fullscreen', 'Fullscreen'],
		['export-template', 'Export'],
		['undo', 'Undo'],
		['redo', 'Redo'],
		['gjs-open-import-webpage', 'Import'],
		['canvas-clear', 'Clear canvas'],
		['save', 'Save page'],
	].forEach((item) => {
		Panels.getButton('options', item[0])?.set('attributes', {
			title: item[1],
			'data-tooltip-pos': 'bottom',
		});
	});
	[
		['open-sm', 'Style Manager'],
		['open-layers', 'Layers'],
		['open-blocks', 'Blocks'],
	].forEach((item) => {
		Panels.getButton('views', item[0])?.set('attributes', {
			title: item[1],
			'data-tooltip-pos': 'bottom',
		});
	});

	const openBl = Panels.getButton('views', obl);
	editor.on('load', () => openBl?.set('active', true));

	// On component change show the Style Manager
	opts.showStylesOnChange &&
		editor.on('component:selected', () => {
			const openSmBtn = Panels.getButton('views', osm);
			const openLayersBtn = Panels.getButton('views', ola);

			// Don't switch when the Layer Manager is on or
			// there is no selected component
			if ((!openLayersBtn || !openLayersBtn.get('active')) && editor.getSelected()) {
				openSmBtn?.set('active', true);
			}
		});
}

export default loadPanels;
