/*
Copyright (c) 2019-current, Artur Arseniev

Modified 2025, withStudioCMS

All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.
- Neither the name "GrapesJS" nor the names of its contributors may be
  used to endorse or promote products derived from this software without
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import type { Component, Plugin } from 'grapesjs';
import type tuiImageEditor from 'tui-image-editor';

type ImageEditor = tuiImageEditor.ImageEditor;
type IOptions = tuiImageEditor.IOptions;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Constructor<K> = { new (...any: any): K };

export type PluginOptions = {
	/**
	 * TOAST UI's configurations
	 * https://nhn.github.io/tui.image-editor/latest/ImageEditor
	 */
	config?: IOptions;

	/**
	 * Pass the editor constructor.
	 * By default, the `tui.ImageEditor` will be used.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	constructor?: any;

	/**
	 * Label for the image editor (used in the modal)
	 * @default 'Image Editor'
	 */
	labelImageEditor?: string;

	/**
	 * Label used on the apply button
	 * @default 'Apply'
	 */
	labelApply?: string;

	/**
	 * Default editor height
	 * @default '650px'
	 */
	height?: string;

	/**
	 * Default editor width
	 * @default '100%'
	 */
	width?: string;

	/**
	 * Id to use to create the image editor command
	 * @default 'tui-image-editor'
	 */
	commandId?: string;

	/**
	 * Icon used in the image component toolbar. Pass an empty string to avoid adding the icon.
	 */
	toolbarIcon?: string;

	/**
	 * Hide the default editor header
	 * @default true
	 */
	hideHeader?: boolean;

	/**
	 * By default, GrapesJS takes the modified image, adds it to the Asset Manager and update the target.
	 * If you need some custom logic you can use this custom 'onApply' function.
	 * @example
	 * onApply: (imageEditor, imageModel) => {
	 *    const dataUrl = imageEditor.toDataURL();
	 *    editor.AssetManager.add({ src: dataUrl }); // Add it to Assets
	 *    imageModel.set('src', dataUrl); // Update the image component
	 * }
	 */
	onApply?: ((imageEditor: ImageEditor, imageModel: Component) => void) | null;

	/**
	 * If no custom `onApply` is passed and this option is `true`, the result image will be added to assets
	 * @default true
	 */
	addToAssets?: boolean;

	/**
	 * If no custom `onApply` is passed, on confirm, the edited image, will be passed to the
	 * AssetManager's uploader and the result (eg. instead of having the dataURL you'll have the URL)
	 * will be passed to the default `onApply` process (update target, etc.)
	 */
	upload?: boolean;

	/**
	 * The apply button (HTMLElement) will be passed as an argument to this function, once created.
	 * This will allow you a higher customization.
	 */
	onApplyButton?: (btn: HTMLElement) => void;

	/**
	 * Scripts to load dynamically in case no TOAST UI editor instance was found
	 */
	script?: string[];

	/**
	 * In case the script is loaded this style will be loaded too
	 */
	style?: string[];
};

const plugin: Plugin<PluginOptions> = (editor, options = {}) => {
	const opts: Required<PluginOptions> = {
		config: {},
		constructor: '',
		labelImageEditor: 'Image Editor',
		labelApply: 'Apply',
		height: '650px',
		width: '100%',
		commandId: 'tui-image-editor',
		toolbarIcon: `<svg viewBox="0 0 24 24">
                    <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z">
                    </path>
                  </svg>`,
		hideHeader: true,
		addToAssets: true,
		upload: false,
		onApplyButton: () => {},
		onApply: null,
		script: [
			'https://uicdn.toast.com/tui.code-snippet/v1.5.2/tui-code-snippet.min.js',
			'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.js',
			'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.js',
		],
		style: [
			'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.css',
			'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.css',
		],
		...options,
	};

	const { script, style, height, width, hideHeader, onApply, upload, addToAssets, commandId } =
		opts;
	const hasWindow = typeof window !== 'undefined';

	const getConstructor = (): Constructor<ImageEditor> => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return opts.constructor || (hasWindow && (window as any).tui?.ImageEditor);
	};

	let constr = getConstructor();

	// Dynamic loading of the image editor scripts and styles
	if (!constr && script?.length && hasWindow) {
		const { head } = document;
		const scripts = Array.isArray(script) ? [...script] : [script];
		const styles = (Array.isArray(style) ? [...style] : [style]) as string[];
		const appendStyle = (styles: string[]) => {
			if (styles.length) {
				const link = document.createElement('link');
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				link.href = styles.shift()!;
				link.rel = 'stylesheet';
				head.appendChild(link);
				appendStyle(styles);
			}
		};
		const appendScript = (scripts: string[]) => {
			if (scripts.length) {
				const scr = document.createElement('script');
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				scr.src = scripts.shift()!;
				scr.onerror = scr.onload = appendScript.bind(null, scripts);
				head.appendChild(scr);
			} else {
				constr = getConstructor();
			}
		};
		appendStyle(styles);
		appendScript(scripts);
	}

	// Update image component toolbar
	if (opts.toolbarIcon) {
		editor.Components.addType('image', {
			extendFn: ['initToolbar'],
			model: {
				initToolbar() {
					const tb = this.get('toolbar');
					const tbExists = tb?.some((item) => item.command === commandId);

					if (!tbExists) {
						tb?.unshift({
							command: commandId,
							label: opts.toolbarIcon,
						});
						this.set('toolbar', tb);
					}
				},
			},
		});
	}

	// Add the image editor command
	const errorOpts = { level: 'error', ns: commandId };
	editor.Commands.add(commandId, {
		imageEditor: null as tuiImageEditor | null,

		run(ed, s, options = {}) {
			if (!constr) {
				ed.log('TOAST UI Image editor not found', errorOpts);
				return ed.stopCommand(commandId);
			}

			const target = (options.target || ed.getSelected()) as Component;

			if (!target) {
				ed.log('Target not available', errorOpts);
				return ed.stopCommand(commandId);
			}

			const content = this.createContent();
			const title = opts.labelImageEditor;
			const btn = content.children[1] as HTMLElement;
			ed.Modal.open({ title, content }).onceClose(() => ed.stopCommand(commandId));

			const editorConfig = this.getEditorConfig(target.get('src'));
			this.imageEditor = new constr(content.children[0], editorConfig);
			ed.getModel().setEditing(true);
			btn.onclick = () => this.applyChanges(target);
			opts.onApplyButton(btn);
		},

		stop(ed) {
			(this.imageEditor as tuiImageEditor)?.destroy();
			ed.getModel().setEditing(false);
		},

		getEditorConfig(path: string): IOptions {
			const config: IOptions = { ...opts.config };

			if (!config.includeUI) config.includeUI = {};

			config.includeUI = {
				theme: {},
				...config.includeUI,
				loadImage: { path, name: '1' },
				uiSize: { height, width },
			};

			if (hideHeader) {
				// @ts-ignore
				config.includeUI.theme['header.display'] = 'none';
			}

			return config;
		},

		createContent(): HTMLDivElement {
			const content = document.createElement('div');
			content.style.position = 'relative';
			content.innerHTML = `
        <div></div>
        <button class="tui-image-editor__apply-btn" style="
          position: absolute;
          top: 0; right: 0;
          margin: 10px;
          background-color: #fff;
          font-size: 1rem;
          border-radius: 3px;
          border: none;
          padding: 10px 20px;
          cursor: pointer
        ">
          ${opts.labelApply}
        </button>
      `;

			return content;
		},

		applyChanges(target: Component) {
			const ied = this.imageEditor as tuiImageEditor;

			if (onApply) {
				onApply(ied, target);
			} else {
				if (ied.getDrawingMode() === 'CROPPER') {
					ied.crop(ied.getCropzoneRect()).then(() => {
						this.uploadImage(ied, target);
					});
				} else {
					this.uploadImage(ied, target);
				}
			}
		},

		uploadImage(imageEditor: ImageEditor, target: Component) {
			const am = editor.Assets;
			const dataURL = imageEditor.toDataURL();

			if (upload) {
				const file = this.dataUrlToBlob(dataURL);
				am.FileUploader().uploadFile(
					{
						dataTransfer: {
							// @ts-ignore
							files: [file],
						},
					},
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					(res: any) => {
						const obj = res?.data?.[0];
						const src = obj && (typeof obj === 'string' ? obj : obj.src);
						src && this.applyToTarget(src, target);
					}
				);
			} else {
				addToAssets &&
					am.add({
						src: dataURL,
						name: (target.get('src') || '').split('/').pop(),
					});
				this.applyToTarget(dataURL, target);
			}
		},

		applyToTarget(result: string, target: Component) {
			target.set('src', result);
			editor.Modal.close();
		},

		dataUrlToBlob(dataURL: string) {
			const data = dataURL.split(',');
			const byteStr = window.atob(data[1]);
			const type = data[0].split(':')[1].split(';')[0];
			const ab = new ArrayBuffer(byteStr.length);
			const ia = new Uint8Array(ab);

			for (let i = 0; i < byteStr.length; i++) {
				ia[i] = byteStr.charCodeAt(i);
			}

			return new Blob([ab], { type });
		},
	});
};

export default plugin;
