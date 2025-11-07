/**

This Template Editor is built using the Ace Editor (https://ace.c9.io/), which is
licensed under the BSD 3-Clause License:

Copyright (c) 2010, Ajax.org B.V.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Ajax.org B.V. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

import { $i18n, baseTranslation, updateSelectOptions } from 'studiocms:i18n/client';
import { ModalHelper } from 'studiocms:ui/components/modal/client';
import { toast } from 'studiocms:ui/components/toaster/client';
import * as ace from 'ace-builds';
import modeHandlebars from 'ace-builds/src-noconflict/mode-handlebars?url';
import themeLight from 'ace-builds/src-noconflict/theme-cloud_editor?url';
import themeDark from 'ace-builds/src-noconflict/theme-cloud_editor_dark?url';

const { default: templateEngine } = await import('@withstudiocms/template-lang');

ace.config.setModuleUrl('ace/mode/handlebars', modeHandlebars);
ace.config.setModuleUrl('ace/theme/cloud_editor', themeLight);
ace.config.setModuleUrl('ace/theme/cloud_editor_dark', themeDark);

// --- TYPE DEFINITIONS ---
type EngineContext = {
	site: {
		title: string;
		description?: string;
		icon?: string;
	};
	data: Record<string, string>;
};

// --- HTML UTILITIES ---
const $ = <T extends HTMLElement>(selector: string): T => document.querySelector(selector) as T;
const $$ = <T extends HTMLElement>(selector: string): NodeListOf<T> =>
	document.querySelectorAll(selector) as NodeListOf<T>;
const $$$ = <T extends HTMLElement>(element: HTMLElement, selectors: string): NodeListOf<T> =>
	element.querySelectorAll(selectors) as NodeListOf<T>;

// --- VARIABLES ---
let t: Record<string, string> = {};

// --- CONSTANTS ---
const i18nCurrentPage = '@studiocms/dashboard:smtp';
const allTemplateButtons = $$('.template-selectors button');
const saveButton = $('#save-template-button');
const resetButton = $('#reset-template-button');
const templateEditor = $('#template-editor');
const previewModal = new ModalHelper('template-editor-preview-modal');
const previewModalButton = $('#template-preview-button');
const previewIframe = $<HTMLIFrameElement>('#template-editor-preview');
const templateVariableSelect = $('#template-variable-examples-dropdown');
const templateSelectorButtons = $$('.template-selectors button');
const currentTheme = window.theme?.getTheme() || 'dark';
const aceTheme = currentTheme === 'light' ? 'cloud_editor' : 'cloud_editor_dark';
const engine = new templateEngine({ strict: true });
const templateVariableLists = {
	notifications: $$('#template-variable-notifications'),
	passwordReset: $$('#template-variable-passwordReset'),
	verifyEmail: $$('#template-variable-verifyEmail'),
	userInvite: $$('#template-variable-userInvite'),
};
const mockContext: EngineContext = {
	site: {
		title: 'Example Site',
		description: 'This is an example site description.',
		icon: 'https://studiocms.dev/favicon.svg',
	},
	data: {
		name: 'John Doe',
		link: '#fake-link',
		title: 'Welcome to Our Service',
		message: 'This is a sample notification message.',
	},
};

// --- DATASET PARSING ---
const templates = JSON.parse(templateEditor.dataset.templates || '{}') as Record<string, string>;
const currentTemplates = JSON.parse(templateEditor.dataset.templateKeys || '[]') as string[];
const defaultTemplates = JSON.parse(templateEditor.dataset.defaultTemplates || '{}') as Record<
	string,
	string
>;
const saveEndpoint = templateEditor.dataset.saveEndpoint as string;

// --- INTERNATIONALIZATION SETUP ---
const i18n = $i18n(i18nCurrentPage, baseTranslation[i18nCurrentPage]);

// --- ACE EDITOR SETUP ---
const editor = ace.edit('template-editor', {
	mode: 'ace/mode/handlebars', // Using Handlebars as its a close match to our templating language
	theme: `ace/theme/${aceTheme}`,
	value: `<!-- ${t['template-editor-preloaded-content']} -->`,
	fontSize: '14px',
	tabSize: 2,
	useSoftTabs: true,
	showPrintMargin: false,
	wrap: true,
	useWorker: false,
	displayIndentGuides: true,
});

// --- FUNCTION UTILITIES ---
/**
 * Updates the visual state of a button element by toggling CSS classes based on its active state.
 *
 * @param button - The HTML element representing the button to update.
 * @param isActive - A boolean indicating whether the button should appear active (`true`) or inactive (`false`).
 *
 * When `isActive` is `true`, the 'primary' class is added and the 'default' class is removed.
 * When `isActive` is `false`, the 'primary' class is removed and the 'default' class is added.
 */
function updateButtonState(button: HTMLElement, isActive: boolean) {
	if (isActive) {
		button.classList.add('primary');
		button.classList.remove('default');
	} else {
		button.classList.remove('primary');
		button.classList.add('default');
	}
}

/**
 * Retrieves the name of the currently selected template from the template editor.
 *
 * @returns The name of the current template selection, or `'none'` if no selection is present.
 */
function getCurrentTemplate(): string {
	return templateEditor.dataset.currentSelection || 'none';
}

/**
 * Displays a success toast notification with the provided message, then reloads the page after a short delay.
 *
 * @param message - The message to display in the success toast notification.
 *
 * @remarks
 * The toast is shown for 3 seconds to allow the user to read the message before the page reloads.
 */
function displaySuccessToastThenReload(message: string) {
	toast({
		title: t['success-label'],
		type: 'success',
		description: message,
	});
	setTimeout(() => {
		window.location.reload();
	}, 3000); // Delay to allow user to read the toast message
}

/**
 * Saves the specified template content under the given template key.
 *
 * If the template key is invalid or not provided, displays an error toast.
 * Otherwise, sends a POST request to the save endpoint with all templates,
 * including the updated one. Displays a success toast and reloads on success,
 * or an error toast on failure.
 *
 * @param templateKey - The unique key identifying the template to save.
 * @param content - The content of the template to be saved.
 * @returns A promise that resolves when the save operation is complete.
 */
async function saveTemplate(templateKey: string, content: string) {
	if (!templateKey || templateKey === 'none') {
		toast({
			title: t['error-label'],
			type: 'danger',
			description: t['template-save-button-error'],
		});
		return;
	}

	const allTemplates = { ...templates, [templateKey]: content };

	try {
		const response = await fetch(saveEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ templates: allTemplates }),
		});

		if (!response.ok) {
			throw new Error(`${t['template-editor-save-failed']}: ${response.statusText}`);
		}

		displaySuccessToastThenReload(t['template-editor-save-success']);
	} catch (_error) {
		toast({
			title: t['error-label'],
			type: 'danger',
			description: t['template-editor-save-unknown'],
		});
	}
}

/**
 * Updates the content of the editor with the provided string.
 *
 * @param content - The new content to set in the editor.
 * @param focus - Optional. If true (default), the editor will be focused after updating the content.
 */
function updateEditorContent(content: string, focus = true) {
	editor.setValue(content, -1); // -1 moves cursor to start
	if (focus) {
		editor.focus();
	}
}

let lastPreviewUrl: string | null = null;
/**
 * Updates the source of the preview iframe with the provided HTML content.
 *
 * This function creates a new Blob from the given HTML string, generates an object URL,
 * and sets it as the source of the preview iframe. If a previous preview URL exists,
 * it is revoked to free up memory.
 *
 * @param content - The HTML content to display in the preview iframe.
 */
function updatePreviewIFrame(content: string) {
	if (lastPreviewUrl) {
		URL.revokeObjectURL(lastPreviewUrl);
		lastPreviewUrl = null;
	}
	const blob = new Blob([content], { type: 'text/html' });
	lastPreviewUrl = URL.createObjectURL(blob);
	previewIframe.src = lastPreviewUrl;
}

// --- INTERNATIONALIZATION LISTENER ---
i18n.subscribe((comp) => {
	t = comp;
	templateSelectorButtons.forEach((button) => {
		button.textContent = comp[button.id.replace('template-btn-', '') as keyof typeof comp];
	});
	updateSelectOptions(
		'template-variable-examples',
		Array.from(templateSelectorButtons).reduce(
			(acc, button) => {
				const templateKey = button.id.replace('template-btn-', '');
				acc[templateKey] = comp[templateKey as keyof typeof comp];
				return acc;
			},
			{} as Record<string, string>
		)
	);
	previewModalButton.setAttribute('title', comp['preview-button-title']);
	const currentTemplate = getCurrentTemplate();
	if (currentTemplate === 'none') {
		updateEditorContent(`<!-- ${comp['template-editor-preloaded-content']} -->`, false);
	}
});

// --- THEME MANAGEMENT ---
const observer = new MutationObserver(() => {
	const newTheme = window.theme?.getTheme() || 'dark';
	const newAceTheme = newTheme === 'light' ? 'cloud_editor' : 'cloud_editor_dark';
	editor.setTheme(`ace/theme/${newAceTheme}`);
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// --- TEMPLATE BUTTON EVENT LISTENERS ---
currentTemplates.forEach((template) => {
	const button = $(`#template-btn-${template}`);
	if (button) {
		button.addEventListener('click', () => {
			// Update button states
			allTemplateButtons.forEach((btn) => {
				updateButtonState(btn, btn.id === button.id);
			});

			// Load the selected template content into the editor
			const templateContent = templates[template] || `<!-- ${t['template-editor-not-found']} -->`;
			updateEditorContent(templateContent);

			// Update current selection data attribute
			templateEditor.dataset.currentSelection = template;
		});
	}
});

// --- SAVE BUTTON EVENT LISTENER ---
saveButton.addEventListener('click', async () => {
	const currentTemplate = getCurrentTemplate();
	if (currentTemplate && templates[currentTemplate] !== undefined) {
		const updatedContent = editor.getValue();
		await saveTemplate(currentTemplate, updatedContent);
	} else {
		toast({
			title: t['error-label'],
			type: 'danger',
			description: t['template-save-reset-button-error'],
		});
	}
});

// --- RESET BUTTON EVENT LISTENER ---
resetButton.addEventListener('click', () => {
	const currentTemplate = getCurrentTemplate();
	if (currentTemplate && defaultTemplates[currentTemplate]) {
		if (!confirm(t['template-reset-button-confirm'])) {
			return;
		}

		const defaultContent = defaultTemplates[currentTemplate];
		updateEditorContent(defaultContent);
	} else {
		toast({
			title: t['error-label'],
			type: 'danger',
			description: t['template-save-reset-button-error'],
		});
	}
});

// --- PREVIEW BUTTON EVENT LISTENER ---
previewModalButton.addEventListener('click', () => {
	// Ensure a template is selected
	const currentTemplate = getCurrentTemplate();
	if (currentTemplate && templates[currentTemplate] !== undefined) {
		// Get the current template content from the editor
		const templateContent = editor.getValue();

		// Render the template with mock context
		try {
			const renderedContent = engine.render(templateContent, mockContext);
			updatePreviewIFrame(renderedContent);
		} catch (error) {
			console.error('Template render failed', error);
			toast({
				title: t['error-label'],
				type: 'danger',
				description: t['template-preview-render-error'],
			});
			return;
		}

		// Open the modal
		previewModal.show();
	} else {
		toast({
			title: t['error-label'],
			type: 'danger',
			description: t['template-preview-button-error'],
		});
	}
});

// --- TEMPLATE SELECTION LISTENERS ---
$$$(templateVariableSelect, '.sui-select-option').forEach((option) => {
	option.addEventListener('click', () => {
		const selectedValue = option.getAttribute('value');

		Object.keys(templateVariableLists).forEach((key) => {
			if (key === selectedValue) {
				templateVariableLists[key as keyof typeof templateVariableLists].forEach((item) =>
					item.classList.remove('hidden')
				);
			} else {
				templateVariableLists[key as keyof typeof templateVariableLists].forEach((item) =>
					item.classList.add('hidden')
				);
			}
		});
	});
});
