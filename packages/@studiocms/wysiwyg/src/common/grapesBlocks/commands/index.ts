import { toast } from '@studiocms/ui/components/Toast/toast.js';
import type { CommandFunction, CommandObject, Component, Editor, ObjectAny } from 'grapesjs';
import {
	cmdClear,
	cmdDeviceDesktop,
	cmdDeviceMobile,
	cmdDeviceTablet,
	commandNameCustomCode,
	keyCustomCode,
} from '../consts.js';
import type { RequiredCustomCodeOptions, RequiredGrapesBlocksOptions } from '../types.js';
import openImport from './openImport.js';

type ContentTypes = HTMLElement | string | undefined;

export function loadCommands(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	const { Commands } = editor;
	const txtConfirm = opts.textCleanCanvas;

	const addCmd = <T extends ObjectAny>(
		id: string,
		// biome-ignore lint/suspicious/noExplicitAny: this is the source type used by grapesjs
		command: CommandFunction | CommandObject<any, T>
	) => {
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
			e.runCommand('core:canvas-clear');
			toast({
				title: 'Canvas Cleared',
				type: 'success',
				description: 'The canvas has been cleared successfully.',
				duration: 5000,
			});
		}
	});

	// Add the custom code commands
	const { modalTitle, codeViewOptions, commandCustomCode, buttonLabel } =
		opts.customCode as RequiredCustomCodeOptions;

	const appendToContent = (target: HTMLElement, content?: ContentTypes) => {
		if (content instanceof HTMLElement) {
			target.appendChild(content);
		} else if (content) {
			target.insertAdjacentHTML('beforeend', content);
		}
	};

	addCmd(commandNameCustomCode, {
		keyCustomCode,
		target: null as null | Component,
		// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
		codeViewer: null as any,

		run(editor, _s, opts = {}) {
			const target = opts.target || editor.getSelected();
			this.target = target;

			if (target?.get('editable')) {
				this.showCustomCode(target, opts);
			}
		},

		stop(editor) {
			editor.Modal.close();
		},

		/**
		 * Method which tells how to show the custom code
		 * @param  {Component} target
		 */

		// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
		showCustomCode(target: Component, options: any) {
			const title = options.title || modalTitle;
			const code = target.get(keyCustomCode) || '';
			const content = this.getContent();
			editor.Modal.open({ title, content }).onceClose(() =>
				editor.stopCommand(commandNameCustomCode)
			);
			this.getCodeViewer().setContent(code);
		},

		/**
		 * Custom pre-content. Can be a simple string or an HTMLElement
		 */
		getPreContent() {},

		/**
		 * Custom post-content. Can be a simple string or an HTMLElement
		 */
		getPostContent() {},

		/**
		 * Get all the content for the custom code
		 * @return {HTMLElement}
		 */
		getContent() {
			const codeViewer = this.getCodeViewer();
			const content = document.createElement('div');
			const pfx = editor.getConfig('stylePrefix');
			content.className = `${pfx}custom-code`;
			appendToContent(content, this.getPreContent() as ContentTypes);
			content.appendChild(codeViewer.getElement());
			appendToContent(content, this.getPostContent() as ContentTypes);
			appendToContent(content, this.getContentActions());
			codeViewer.refresh();
			setTimeout(() => codeViewer.focus(), 0);

			return content;
		},

		/**
		 * Get the actions content. Can be a simple string or an HTMLElement
		 * @return {HTMLElement|String}
		 */
		getContentActions() {
			const btn = document.createElement('button');
			btn.setAttribute('type', 'button');
			const pfx = editor.getConfig('stylePrefix');
			btn.innerHTML = buttonLabel;
			btn.className = `${pfx}btn-prim ${pfx}btn-import__custom-code`;
			btn.onclick = () => this.handleSave();

			return btn;
		},

		/**
		 * Handle the main save task
		 */
		handleSave() {
			const { target } = this;
			const code = this.getCodeViewer().getContent();
			target?.set(keyCustomCode, code);
			editor.Modal.close();
		},

		/**
		 * Return the code viewer instance
		 * @return {CodeViewer}
		 */
		getCodeViewer() {
			if (!this.codeViewer) {
				this.codeViewer = editor.CodeManager.createViewer({
					codeName: 'htmlmixed',
					theme: 'hopscotch',
					readOnly: 0,
					...codeViewOptions,
				});
			}
			return this.codeViewer;
		},

		...commandCustomCode,
	});
}

export default loadCommands;
