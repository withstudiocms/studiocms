// Storage File Browser Web Component

interface StorageFile {
	key: string;
	size: number;
	lastModified?: Date;
}

interface MimeTypeMap {
	[key: string]: string;
}

type StorageReturnType = 'url' | 'identifier' | 'key';

const s3SafeNameRegex = /^[a-zA-Z0-9._~-]*$/g;

/**
 * Translation strings for the StorageFileBrowser
 */
interface TranslationStrings {
	// Modal & Headers
	selectFile: string;
	closeFileBrowser: string;

	// Toolbar Actions
	upload: string;
	newFolder: string;
	refresh: string;
	root: string;

	// File Browser
	loadingFiles: string;
	testingConnection: string;
	noFilesHere: string;
	noFileSelected: string;

	// Buttons
	cancel: string;
	select: string;
	delete: string;

	// Upload Dialog
	customizeFilenames: string;
	filename: string;

	// Delete Dialog
	deleteFile: string;
	deleteFileConfirm: string;
	deleteFolder: string;
	deleteFolderConfirm: string;

	// Create Folder Dialog
	createNewFolder: string;
	folderName: string;
	create: string;

	// Rename Dialog
	renameFile: string;
	renameFolder: string;
	newName: string;
	rename: string;

	// Preview Dialog
	preview: string;
	download: string;
	close: string;

	// Messages
	creatingFolder: string;
	uploadingFiles: string;
	uploadProgress: string; // "{current} / {total} files uploaded"
	deletingFile: string;
	deletingFolder: string;
	renamingFile: string;
	renamingFolder: string;

	// Errors
	failedToLoadFiles: string;
	failedToCreateFolder: string;
	failedToUploadFiles: string;
	failedToDeleteFile: string;
	failedToDeleteFolder: string;
	failedToRenameFile: string;
	failedToRenameFolder: string;
	failedToPreviewFile: string;
	failedToLoadImage: string;
	failedConnection: string;
	checkConfiguration: string;
	noStorageConfigured: string;
	unknownError: string;

	// Aria Labels
	fileBrowserActions: string;
	filePathBreadcrumb: string;
	fileUploadInput: string;
	fileBrowserContent: string;
	filesAndFolders: string;
	folderLabel: string; // "Folder: {name}"
	fileLabel: string; // "File: {name}, Size: {size}"
	renameLabel: string; // "Rename {name}"
	deleteLabel: string; // "Delete {name}"
	previewLabel: string; // "Preview {name}"
	filenameForLabel: string; // "Filename for {name}"
	uploadProgressLabel: string;

	// Inline strings
	original: string;
	size: string;
	andAllItsContents: string;
	filePreview: string;
}

class InvalidFileNameError extends Error {
	constructor(files: string[]) {
		super(`The following filenames are invalid: ${files.join(', ')}`);
		this.name = 'InvalidFileNameError';
	}
}

/**
 * StorageFileBrowser Custom Element
 * A web component for browsing and selecting files from cloud storage
 */
class StorageFileBrowser extends HTMLElement {
	private currentPath = '';
	private selectedFile: StorageFile | null = null;
	private triggerId!: string;
	private targetInputId: string | undefined;
	private fileTypes!: string[];
	private filesOnly!: boolean;
	private returnType!: StorageReturnType;
	private modalId!: string;
	private contentId!: string;
	private isUploading = false;
	private apiEndpoint = '/studiocms_api/integrations/storage/manager';
	private pendingFiles: File[] = [];
	private fileToDelete: StorageFile | null = null;
	private fileToRename: StorageFile | null = null;
	private connectionEstablished = false;
	private currentLocale!: string;
	private translations!: TranslationStrings;
	private translationMap!: Record<string, TranslationStrings>;
	private localI18nStorageKey = 'studiocms-i18n-locale';
	private connectionTestResponse = {
		status: 0,
		message: '',
	};

	constructor() {
		super();

		// Listen for locale change events
		window.addEventListener('storage-browser:locale-change', ((e: CustomEvent) => {
			if (e.detail.locale) {
				this.setLocale(e.detail.locale);
			} else {
				this.updateLocale();
			}
		}) as EventListener);
	}

	/**
	 * Helper to select single element within shadow DOM
	 */
	private $ = <E extends HTMLElement>(selectors: string): E | null => {
		return this.querySelector<E>(selectors);
	};

	/**
	 * Helper to select multiple elements within shadow DOM
	 */
	private $all = <E extends HTMLElement>(selectors: string): NodeListOf<E> => {
		return this.querySelectorAll<E>(selectors);
	};

	/**
	 * Helper to select element by ID in the main document
	 */
	private $$id = <E extends HTMLElement>(elementId: string): E | null => {
		return document.getElementById(elementId) as E | null;
	};

	private getAttr(name: string): string | null;
	private getAttr(name: string, defaultValue: string): string;

	/**
	 * Get attribute with optional default value
	 *
	 * If the attribute is not set and no default value is provided, returns null
	 */
	private getAttr(name: string, defaultValue?: string): string | null {
		const fallback = defaultValue ?? null;
		return this.getAttribute(name) ?? fallback;
	}

	/**
	 * Set the current locale and update translations
	 */
	private setLocale(locale: string): void {
		if (this.translationMap[locale]) {
			this.currentLocale = locale;
			this.translations = this.translationMap[locale];
			localStorage.setItem(this.localI18nStorageKey, locale);
			// Re-render if component is already connected
			if (this.isConnected) {
				this.render();
				this.attachEventListeners();
				// Reload current view
				this.loadFiles();
			}
		} else {
			console.warn(`Locale "${locale}" not found, falling back to "en"`);
		}
	}

	/**
	 * Update locale from localStorage or fallback to 'en'
	 */
	private updateLocale() {
		let savedLocale = localStorage.getItem(this.localI18nStorageKey);
		if (!savedLocale) {
			savedLocale = 'en';
			console.warn(`No saved locale found, using fallback lang "${savedLocale}"`);
		}
		this.setLocale(savedLocale);
	}

	/**
	 * Get translation for a key
	 */
	private t(key: keyof TranslationStrings): string {
		return this.translations[key] || this.translationMap.en[key] || key;
	}

	private resetEventListeners(): void {
		// Remove all event listeners by cloning the node
		const clone = this.cloneNode(true);
		this.replaceWith(clone);
	}

	connectedCallback(): void {
		// Setup Translations
		const translationMapAttr = this.getAttr('translation-map', '{}');
		this.translationMap = JSON.parse(translationMapAttr);
		this.translations = this.translationMap[this.currentLocale] || this.translationMap.en;

		const savedLocale = localStorage.getItem(this.localI18nStorageKey);
		this.setLocale(savedLocale || 'en');

		// Get attributes
		this.triggerId = this.getAttr('trigger-id', '');
		this.targetInputId = this.getAttr('target-input-id') || undefined;
		const fileTypesAttr = this.getAttr('file-types', '[]');
		this.fileTypes = JSON.parse(fileTypesAttr);

		this.filesOnly = this.getAttr('files-only', 'false') === 'true';
		this.returnType = this.getAttr('return-type', 'url') as StorageReturnType;

		// Generate unique IDs
		this.modalId = `storage-browser-${this.triggerId}`;
		this.contentId = `storage-browser-content-${this.triggerId}`;

		// Render the component
		this.render();
		this.attachEventListeners();
	}

	/**
	 * Render the component
	 */
	private render(): void {
		this.innerHTML = `
      <div id="${this.modalId}" class="storage-browser-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title-${this.triggerId}">
        <div class="storage-browser-overlay" aria-hidden="true"></div>
        <div class="storage-browser-container">
          <div class="storage-browser-header">
            <h3 id="modal-title-${this.triggerId}">${this.t('selectFile')}</h3>
            <button class="storage-browser-close" data-close-modal="${this.modalId}" aria-label="${this.t('closeFileBrowser')}">&times;</button>
          </div>
          
          <div class="storage-browser-toolbar" role="toolbar" aria-label="${this.t('fileBrowserActions')}">
            <nav id="breadcrumb-${this.triggerId}" class="storage-browser-breadcrumb" aria-label="${this.t('filePathBreadcrumb')}"></nav>
            <div class="storage-browser-toolbar-actions">
              <button class="storage-browser-btn storage-browser-btn-small" data-upload="${this.triggerId}" aria-label="${this.t('upload')}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                ${this.t('upload')}
              </button>
              ${
								!this.filesOnly
									? `<button class="storage-browser-btn storage-browser-btn-small" data-create-folder="${this.triggerId}" aria-label="${this.t('newFolder')}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                ${this.t('newFolder')}
              </button>`
									: ''
							}
              <button class="storage-browser-btn storage-browser-btn-small" data-refresh="${this.triggerId}" aria-label="${this.t('refresh')}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ${this.t('refresh')}
              </button>
            </div>
            <input type="file" id="upload-input-${this.triggerId}" style="display: none;" multiple aria-label="${this.t('fileUploadInput')}" />
          </div>

          <div id="${this.contentId}" class="storage-browser-content" role="region" aria-label="${this.t('fileBrowserContent')}" aria-live="polite">
            <div class="storage-browser-loading" role="status" aria-live="polite">${this.t('loadingFiles')}</div>
          </div>

          <div class="storage-browser-footer">
            <div class="storage-browser-selected" id="selected-${this.triggerId}" role="status" aria-live="polite" aria-atomic="true">
              ${this.t('noFileSelected')}
            </div>
            <div class="storage-browser-actions">
              <button class="storage-browser-btn storage-browser-btn-secondary" data-close-modal="${this.modalId}">${this.t('cancel')}</button>
              <button class="storage-browser-btn storage-browser-btn-primary" id="select-btn-${this.triggerId}" disabled aria-disabled="true">${this.t('select')}</button>
            </div>
          </div>
        </div>
      </div>

      <div id="upload-dialog-${this.triggerId}" class="storage-browser-upload-dialog" role="dialog" aria-modal="true" aria-labelledby="upload-dialog-title-${this.triggerId}" style="display: none;">
        <div class="storage-browser-overlay" aria-hidden="true"></div>
        <div class="storage-browser-dialog-container">
          <div class="storage-browser-dialog-header">
            <h3 id="upload-dialog-title-${this.triggerId}">${this.t('customizeFilenames')}</h3>
          </div>
          <div class="storage-browser-dialog-content" id="upload-dialog-content-${this.triggerId}">
          </div>
          <div class="storage-browser-dialog-footer">
            <button class="storage-browser-btn storage-browser-btn-secondary" id="upload-dialog-cancel-${this.triggerId}">${this.t('cancel')}</button>
            <button class="storage-browser-btn storage-browser-btn-primary" id="upload-dialog-confirm-${this.triggerId}">${this.t('upload')}</button>
          </div>
        </div>
      </div>

      <div id="delete-dialog-${this.triggerId}" class="storage-browser-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title-${this.triggerId}" style="display: none;">
        <div class="storage-browser-overlay" aria-hidden="true"></div>
        <div class="storage-browser-dialog-container storage-browser-dialog-small">
          <div class="storage-browser-dialog-header">
            <h3 id="delete-dialog-title-${this.triggerId}">${this.t('deleteFile')}</h3>
          </div>
          <div class="storage-browser-dialog-content" id="delete-dialog-content-${this.triggerId}">
            <p>${this.t('deleteFileConfirm')}</p>
            <p class="storage-browser-delete-filename"></p>
          </div>
          <div class="storage-browser-dialog-footer">
            <button class="storage-browser-btn storage-browser-btn-secondary" id="delete-dialog-cancel-${this.triggerId}">${this.t('cancel')}</button>
            <button class="storage-browser-btn storage-browser-btn-danger" id="delete-dialog-confirm-${this.triggerId}">${this.t('delete')}</button>
          </div>
        </div>
      </div>

      <!-- Create Folder Dialog -->
      <div id="folder-dialog-${this.triggerId}" class="storage-browser-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="folder-dialog-title-${this.triggerId}">
        <div class="storage-browser-overlay" aria-hidden="true"></div>
        <div class="storage-browser-dialog-container storage-browser-dialog-small">
          <div class="storage-browser-dialog-header">
            <h3 id="folder-dialog-title-${this.triggerId}">${this.t('createNewFolder')}</h3>
          </div>
          <div class="storage-browser-dialog-content" id="folder-dialog-content-${this.triggerId}">
            <p style="color: var(--storage-browser-text-normal);">${this.t('folderName')}:</p>
            <input type="text" id="folder-name-input-${this.triggerId}" class="storage-browser-upload-filename" placeholder="${this.t('folderName')}" aria-label="${this.t('folderName')}" />
          </div>
          <div class="storage-browser-dialog-footer">
            <button class="storage-browser-btn storage-browser-btn-secondary" id="folder-dialog-cancel-${this.triggerId}">${this.t('cancel')}</button>
            <button class="storage-browser-btn storage-browser-btn-primary" id="folder-dialog-confirm-${this.triggerId}">${this.t('create')}</button>
          </div>
        </div>
      </div>

      <!-- Rename Dialog -->
      <div id="rename-dialog-${this.triggerId}" class="storage-browser-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-dialog-title-${this.triggerId}">
        <div class="storage-browser-overlay" aria-hidden="true"></div>
        <div class="storage-browser-dialog-container storage-browser-dialog-small">
          <div class="storage-browser-dialog-header">
            <h3 id="rename-dialog-title-${this.triggerId}">${this.t('renameFile')}</h3>
          </div>
          <div class="storage-browser-dialog-content" id="rename-dialog-content-${this.triggerId}">
            <p style="color: var(--storage-browser-text-normal);">${this.t('newName')}:</p>
            <p class="storage-browser-delete-filename" id="rename-current-name-${this.triggerId}"></p>
            <input type="text" id="rename-input-${this.triggerId}" class="storage-browser-upload-filename" placeholder="${this.t('newName')}" aria-label="${this.t('newName')}" />
          </div>
          <div class="storage-browser-dialog-footer">
            <button class="storage-browser-btn storage-browser-btn-secondary" id="rename-cancel-btn-${this.triggerId}">${this.t('cancel')}</button>
            <button class="storage-browser-btn storage-browser-btn-primary" id="rename-confirm-btn-${this.triggerId}">${this.t('rename')}</button>
          </div>
        </div>
      </div>

      <!-- Preview Dialog -->
      <div id="preview-dialog-${this.triggerId}" class="storage-browser-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-dialog-title-${this.triggerId}" style="display: none;">
        <div class="storage-browser-overlay" aria-hidden="true"></div>
        <div class="storage-browser-dialog-container storage-browser-preview-dialog">
          <div class="storage-browser-dialog-header storage-browser-preview-header">
            <h3 id="preview-dialog-title-${this.triggerId}">${this.t('preview')}</h3>
            <div class="storage-browser-preview-actions">
              <a id="preview-download-btn-${this.triggerId}" class="storage-browser-preview-download" download aria-label="${this.t('download')}" title="${this.t('download')}">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <button class="storage-browser-preview-close" id="preview-close-btn-${this.triggerId}" aria-label="${this.t('close')}" title="${this.t('close')}">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="storage-browser-dialog-content storage-browser-preview-content" id="preview-content-${this.triggerId}">
            <div class="storage-browser-preview-loading" id="preview-loading-${this.triggerId}">
              <div class="storage-browser-spinner"></div>
              <p>${this.t('loadingFiles')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
	}

	// On setup, test connection and if connection is unavailable disable trigger
	async onloadTest(trigger: HTMLButtonElement) {
		const connected = await this.testConnection();
		if (!connected) {
			// Disable trigger if connection fails
			trigger.disabled = true;
			// Set a11y and hovertext
			trigger.setAttribute('aria-disabled', 'true');
			trigger.setAttribute(
				'title',
				this.t(this.connectionTestResponse.message as keyof TranslationStrings) ||
					this.connectionTestResponse.message
			);
			trigger.classList.add('disabled');
			trigger.style.cursor = 'not-allowed';
		}
	}

	private attachEventListeners(): void {
		const modal = this.$<HTMLDivElement>(`#${this.modalId}`);
		const trigger = this.$$id<HTMLButtonElement>(this.triggerId);
		const targetInput = this.targetInputId
			? this.$$id<HTMLInputElement>(this.targetInputId)
			: undefined;
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		const selectedInfo = this.$<HTMLDivElement>(`#selected-${this.triggerId}`);
		const selectBtn = this.$<HTMLButtonElement>(`#select-btn-${this.triggerId}`);
		const refreshBtn = this.$<HTMLButtonElement>(`[data-refresh="${this.triggerId}"]`);
		const uploadBtn = this.$<HTMLButtonElement>(`[data-upload="${this.triggerId}"]`);
		const uploadInput = this.$<HTMLInputElement>(`#upload-input-${this.triggerId}`);

		if (!modal || !content || !selectedInfo || !selectBtn || !trigger) return;

		this.onloadTest(trigger);

		// Open modal
		trigger?.addEventListener('click', async () => {
			modal.classList.add('open');

			// Test connection first
			const connected = await this.testConnection();
			if (!connected) {
				// Disable action buttons if connection fails
				if (uploadBtn) uploadBtn.disabled = true;
				if (refreshBtn) refreshBtn.disabled = true;
				const createFolderBtn = this.$<HTMLButtonElement>(
					`[data-create-folder="${this.triggerId}"]`
				);
				if (createFolderBtn) createFolderBtn.disabled = true;
			} else {
				// Enable buttons if connection succeeds
				if (uploadBtn) uploadBtn.disabled = false;
				if (refreshBtn) refreshBtn.disabled = false;
				const createFolderBtn = this.$<HTMLButtonElement>(
					`[data-create-folder="${this.triggerId}"]`
				);
				if (createFolderBtn) createFolderBtn.disabled = false;
				this.loadFiles();
			}

			// Focus the close button for accessibility
			setTimeout(() => {
				const closeBtn = this.$<HTMLButtonElement>('.storage-browser-close');
				closeBtn?.focus();
			}, 100);
		});

		// Keyboard support for Escape key
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && modal.classList.contains('open')) {
				modal.classList.remove('open');
				this.selectedFile = null;
				this.updateSelectedInfo();
				trigger?.focus(); // Return focus to trigger
				document.removeEventListener('keydown', handleKeyDown);
			}
		};
		document.addEventListener('keydown', handleKeyDown);

		// Close modal handlers
		this.$all<HTMLButtonElement>(`[data-close-modal="${this.modalId}"]`).forEach((btn) => {
			btn.addEventListener('click', () => {
				modal.classList.remove('open');
				this.selectedFile = null;
				this.updateSelectedInfo();
			});
		});

		// Close on overlay click
		this.$('.storage-browser-overlay')?.addEventListener('click', () => {
			modal.classList.remove('open');
			this.selectedFile = null;
			this.updateSelectedInfo();
		});

		// Refresh button
		refreshBtn?.addEventListener('click', () => this.loadFiles());

		// Upload button
		uploadBtn?.addEventListener('click', () => {
			uploadInput?.click();
		});

		// Create folder button
		const createFolderBtn = this.$<HTMLButtonElement>(`[data-create-folder="${this.triggerId}"]`);
		createFolderBtn?.addEventListener('click', () => this.showCreateFolderDialog());

		// Folder dialog handlers
		const folderDialog = this.$<HTMLDivElement>(`#folder-dialog-${this.triggerId}`);
		const folderCancelBtn = this.$(`#folder-dialog-cancel-${this.triggerId}`);
		const folderConfirmBtn = this.$(`#folder-dialog-confirm-${this.triggerId}`);
		const folderNameInput = this.$<HTMLInputElement>(`#folder-name-input-${this.triggerId}`);

		if (folderDialog && folderCancelBtn && folderConfirmBtn && folderNameInput) {
			folderCancelBtn.addEventListener('click', () => {
				folderDialog.style.display = 'none';
				folderNameInput.value = '';
			});

			folderConfirmBtn.addEventListener('click', async () => {
				const folderName = folderNameInput.value.trim();
				if (folderName) {
					await this.createFolder(folderName);
					folderDialog.style.display = 'none';
					folderNameInput.value = '';
				}
			});

			folderNameInput.addEventListener('keydown', async (e) => {
				if (e.key === 'Enter') {
					const folderName = folderNameInput.value.trim();
					if (folderName) {
						await this.createFolder(folderName);
						folderDialog.style.display = 'none';
						folderNameInput.value = '';
					}
				} else if (e.key === 'Escape') {
					folderDialog.style.display = 'none';
					folderNameInput.value = '';
				}
			});
		}

		// File input change
		uploadInput?.addEventListener('change', async (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files && files.length > 0) {
				this.pendingFiles = Array.from(files);
				this.showUploadDialog();
				// Reset input
				(e.target as HTMLInputElement).value = '';
			}
		});

		// Drag and drop support
		content.addEventListener('dragover', (e) => {
			e.preventDefault();
			e.stopPropagation();
			content.classList.add('storage-browser-drag-over');
		});

		content.addEventListener('dragleave', (e) => {
			e.preventDefault();
			e.stopPropagation();
			// Only remove class if we're leaving the content area itself
			if (e.target === content) {
				content.classList.remove('storage-browser-drag-over');
			}
		});

		content.addEventListener('drop', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			content.classList.remove('storage-browser-drag-over');

			const files = e.dataTransfer?.files;
			if (files && files.length > 0) {
				this.pendingFiles = Array.from(files);
				this.showUploadDialog();
			}
		});

		// Select button
		selectBtn?.addEventListener('click', async () => {
			if (!this.selectedFile) return;

			let value = '';

			if (this.returnType === 'url') {
				const response = await fetch(this.apiEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'publicUrl', key: this.selectedFile.key }),
				});
				const data = await response.json();
				value = data.url;
			} else if (this.returnType === 'identifier') {
				value = `storage-file://${this.selectedFile.key}`;
			} else {
				value = this.selectedFile.key;
			}

			if (targetInput) {
				targetInput.value = value;
				targetInput.dispatchEvent(new Event('change', { bubbles: true }));
			}

			modal.style.display = 'none';
			this.selectedFile = null;
			this.updateSelectedInfo();
			this.resetEventListeners();
		});
	}

	private async testConnection(): Promise<boolean> {
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return false;

		content.innerHTML = `<div class="storage-browser-loading" role="status">${this.t('testingConnection')}</div>`;

		try {
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'test' }),
			});

			const data = await response.json();

			// Handle 501 from no-op storage provider
			if (response.status === 501 && data.error) {
				this.connectionEstablished = false;
				content.innerHTML = `
                    <div class="storage-browser-error" role="alert">
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>${this.t(data.error)}</p>
                    </div>
                `;

				this.connectionTestResponse = {
					status: response.status,
					message: data.error || 'No error message provided',
				};

				return false;
			}

			if (!response.ok) {
				this.connectionTestResponse = {
					status: response.status,
					message: data.error || 'No error message provided',
				};
				throw new Error(data.error || 'Connection test failed');
			}

			this.connectionEstablished = data.success === true;

			if (!this.connectionEstablished) {
				content.innerHTML = `
                    <div class="storage-browser-error" role="alert">
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>${this.t('failedConnection')}</p>
                        <p style="font-size: 0.875rem; opacity: 0.7;">${this.t('checkConfiguration')}</p>
                    </div>
                `;
			}

			return this.connectionEstablished;
		} catch (error) {
			console.error('Storage connection test failed:', error);
			this.connectionEstablished = false;
			this.connectionTestResponse = {
				status: 500,
				message: 'Unknown error',
			};
			content.innerHTML = `
                <div class="storage-browser-error" role="alert">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedConnection')}</p>
                    <p style="font-size: 0.875rem; opacity: 0.7;">${error instanceof Error ? error.message : this.t('unknownError')}</p>
                </div>
            `;
			return false;
		}
	}

	private async loadFiles(): Promise<void> {
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return;

		content.innerHTML = `<div class="storage-browser-loading">${this.t('loadingFiles')}</div>`;

		try {
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'list', prefix: this.currentPath }),
			});
			const data = await response.json();
			const files: StorageFile[] = data.files;

			this.updateBreadcrumb();

			// Process files and folders
			const folders = new Set<string>();
			const fileItems: StorageFile[] = [];

			files.forEach((file) => {
				const relativePath = file.key.substring(this.currentPath.length);
				const parts = relativePath.split('/');

				if (parts.length > 1 && parts[0]) {
					folders.add(parts[0]);
				} else if (parts[0] && parts[0] !== '.folder') {
					// Filter by file type if specified
					if (this.fileTypes.length > 0) {
						const ext = parts[0].split('.').pop()?.toLowerCase();
						const mimeType = this.getMimeType(ext);
						if (!this.fileTypes.includes(mimeType)) return;
					}
					fileItems.push(file);
				}
			});

			if (folders.size === 0 && fileItems.length === 0) {
				content.innerHTML = `
          <div class="storage-browser-empty" role="status" aria-live="polite">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            <p>${this.t('noFilesHere')}</p>
          </div>
        `;
				return;
			}

			let html = `<div class="storage-browser-grid" role="grid" aria-label="${this.t('filesAndFolders')}">`;

			// Add folders (unless filesOnly is true)
			if (!this.filesOnly) {
				folders.forEach((folder) => {
					html += `
            <div class="storage-browser-item storage-browser-folder" data-folder="${folder}" role="gridcell" tabindex="0" aria-label="${this.t('folderLabel').replace('{name}', folder)}">
              <div class="storage-browser-file-actions">
                <button class="storage-browser-rename-btn" data-rename-folder="${folder}" aria-label="${this.t('renameLabel').replace('{name}', folder)}" title="${this.t('rename')}">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="storage-browser-delete-btn" data-delete-folder="${folder}" aria-label="${this.t('deleteLabel').replace('{name}', folder)}" title="${this.t('delete')}">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div class="storage-browser-icon" aria-hidden="true">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
              </div>
              <div class="storage-browser-name">${folder}</div>
            </div>
          `;
				});
			}

			// Add files
			fileItems.forEach((file) => {
				const fileName = file.key.split('/').pop();
				const displayName = this.formatFileName(fileName);
				const fileExt = fileName?.split('.').pop()?.toLowerCase();
				const fileSize = this.formatBytes(file.size);
				const isPreviewable = this.isFilePreviewable(fileExt);

				html += `
          <div class="storage-browser-item storage-browser-file" data-file='${JSON.stringify(file)}' role="gridcell" tabindex="0" aria-label="${this.t('fileLabel').replace('{name}', displayName).replace('{size}', fileSize)}">
            <div class="storage-browser-file-actions">
              ${
								isPreviewable
									? `<button class="storage-browser-preview-btn" data-preview-file='${JSON.stringify(file)}' aria-label="${this.t('previewLabel').replace('{name}', displayName)}" title="${this.t('preview')}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>`
									: ''
							}
              <button class="storage-browser-rename-btn" data-rename-file='${JSON.stringify(file)}' aria-label="${this.t('renameLabel').replace('{name}', displayName)}" title="${this.t('rename')}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="storage-browser-delete-btn" data-delete-file='${JSON.stringify(file)}' aria-label="${this.t('deleteLabel').replace('{name}', displayName)}" title="${this.t('delete')}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div class="storage-browser-icon" aria-hidden="true">
              ${this.getFileIcon(fileExt)}
            </div>
            <div class="storage-browser-name">${displayName}</div>
            <div class="storage-browser-size">${fileSize}</div>
          </div>
        `;
			});

			html += '</div>';
			content.innerHTML = html;

			// Add click handlers for folders
			content.querySelectorAll<HTMLDivElement>('[data-folder]').forEach((el) => {
				const handleFolderActivation = (e: Event) => {
					// Don't navigate if clicking on a button
					const target = e.target as HTMLElement;
					if (target.closest('button')) return;

					const folder = el.getAttribute('data-folder');
					if (folder) this.navigateToFolder(folder);
				};

				el.addEventListener('click', handleFolderActivation);
				el.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleFolderActivation(e);
					}
				});
			});

			// Add click handlers for files
			content.querySelectorAll<HTMLDivElement>('[data-file]').forEach((el) => {
				const handleFileSelection = () => {
					content.querySelectorAll('.storage-browser-file').forEach((f) => {
						f.classList.remove('selected');
						f.setAttribute('aria-selected', 'false');
					});
					el.classList.add('selected');
					el.setAttribute('aria-selected', 'true');

					const fileData = el.getAttribute('data-file');
					if (fileData) {
						const file: StorageFile = JSON.parse(fileData);
						this.selectedFile = file;
						this.updateSelectedInfo();
					}
				};

				el.addEventListener('click', handleFileSelection);
				el.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleFileSelection();
					}
				});
			});

			// Add delete button handlers
			content.querySelectorAll<HTMLButtonElement>('[data-delete-file]').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					e.stopPropagation(); // Prevent file selection
					const fileData = btn.getAttribute('data-delete-file');
					if (fileData) {
						const file: StorageFile = JSON.parse(fileData);
						this.showDeleteConfirmation(file);
					}
				});
			});

			// Add rename button handlers
			content.querySelectorAll<HTMLButtonElement>('[data-rename-file]').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					e.stopPropagation(); // Prevent file selection
					const fileData = btn.getAttribute('data-rename-file');
					if (fileData) {
						const file: StorageFile = JSON.parse(fileData);
						this.showRenameDialog(file);
					}
				});
			});

			// Add folder rename button handlers
			content.querySelectorAll<HTMLButtonElement>('[data-rename-folder]').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					const folderName = btn.getAttribute('data-rename-folder');
					if (folderName) this.showRenameFolderDialog(folderName);
				});
			});

			// Add folder delete button handlers
			content.querySelectorAll<HTMLButtonElement>('[data-delete-folder]').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					const folderName = btn.getAttribute('data-delete-folder');
					if (folderName) {
						this.showDeleteFolderConfirmation(folderName);
					}
				});
			});

			// Add preview button handlers
			content.querySelectorAll<HTMLButtonElement>('[data-preview-file]').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					e.stopPropagation(); // Prevent file selection
					const fileData = btn.getAttribute('data-preview-file');
					if (fileData) {
						const file: StorageFile = JSON.parse(fileData);
						this.showPreview(file);
					}
				});
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			content.innerHTML = `<div class="storage-browser-error" role="alert" aria-live="assertive">${this.t('failedToLoadFiles')}: ${errorMessage}</div>`;
		}
	}

	private navigateToFolder(folderName: string): void {
		this.currentPath = `${this.currentPath}${folderName}/`;
		this.selectedFile = null;
		this.updateSelectedInfo();
		this.loadFiles();
	}

	private navigateToPath(path: string): void {
		this.currentPath = path;
		this.selectedFile = null;
		this.updateSelectedInfo();
		this.loadFiles();
	}

	private updateBreadcrumb(): void {
		const breadcrumb = this.$<HTMLDivElement>(`#breadcrumb-${this.triggerId}`);
		if (!breadcrumb) return;

		if (!this.currentPath) {
			breadcrumb.innerHTML = `
        <span class="storage-browser-crumb active">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          ${this.t('root')}
        </span>
      `;
			return;
		}

		const parts = this.currentPath.split('/').filter((p) => p);
		let path = '';

		const crumbs: string[] = [
			`
      <span class="storage-browser-crumb" data-path="">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        ${this.t('root')}
      </span>
    `,
		];

		parts.forEach((part, index) => {
			path += `${part}/`;
			const isLast = index === parts.length - 1;
			crumbs.push(`<span class="storage-browser-separator">/</span>`);
			if (isLast) {
				crumbs.push(`<span class="storage-browser-crumb active">${part}</span>`);
			} else {
				crumbs.push(`<span class="storage-browser-crumb" data-path="${path}">${part}</span>`);
			}
		});

		breadcrumb.innerHTML = crumbs.join('');

		// Add click handlers to breadcrumbs
		breadcrumb.querySelectorAll<HTMLSpanElement>('[data-path]').forEach((el) => {
			el.addEventListener('click', () => {
				const pathAttr = el.getAttribute('data-path');
				if (pathAttr !== null) this.navigateToPath(pathAttr);
			});
		});
	}

	private updateSelectedInfo(): void {
		const selectedInfo = this.$<HTMLDivElement>(`#selected-${this.triggerId}`);
		const selectBtn = this.$<HTMLButtonElement>(`#select-btn-${this.triggerId}`);

		if (!selectedInfo || !selectBtn) return;

		if (this.selectedFile) {
			const fileName = this.selectedFile.key.split('/').pop();
			selectedInfo.innerHTML = `${this.t('select')}: <strong>${fileName}</strong>`;
			selectBtn.disabled = false;
		} else {
			selectedInfo.textContent = this.t('noFileSelected');
			selectBtn.disabled = true;
		}
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
	}

	private formatFileName(fileName: string | undefined): string {
		if (!fileName) return '';

		// If the filename starts with a timestamp-like pattern (e.g., 1765388443236-example.png)
		// Extract just the meaningful part after the timestamp
		const timestampPattern = /^\d{10,}-(.+)$/;
		const match = fileName.match(timestampPattern);

		if (match) {
			return match[1]; // Return everything after the timestamp and dash
		}

		return fileName;
	}

	private getMimeType(ext: string | undefined): string {
		if (!ext) return 'application/octet-stream';

		const types: MimeTypeMap = {
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			png: 'image/png',
			gif: 'image/gif',
			webp: 'image/webp',
			svg: 'image/svg+xml',
			mp4: 'video/mp4',
			webm: 'video/webm',
			mp3: 'audio/mpeg',
			wav: 'audio/wav',
			pdf: 'application/pdf',
			zip: 'application/zip',
		};
		return types[ext] || 'application/octet-stream';
	}

	private getFileIcon(ext: string | undefined): string {
		if (!ext) return this.getDefaultIcon();

		// Images
		const imageExts = [
			'jpg',
			'jpeg',
			'png',
			'gif',
			'webp',
			'svg',
			'bmp',
			'ico',
			'tiff',
			'tif',
			'heic',
			'heif',
			'avif',
		];
		if (imageExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
		}

		// Videos
		const videoExts = [
			'mp4',
			'webm',
			'mov',
			'avi',
			'mkv',
			'flv',
			'wmv',
			'm4v',
			'mpg',
			'mpeg',
			'3gp',
			'ogv',
		];
		if (videoExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
		}

		// Audio
		const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'ape', 'opus'];
		if (audioExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
		}

		// Code files
		const codeExts = [
			'js',
			'jsx',
			'ts',
			'tsx',
			'py',
			'java',
			'c',
			'cpp',
			'cs',
			'php',
			'rb',
			'go',
			'rs',
			'swift',
			'kt',
			'dart',
			'scala',
			'r',
			'sh',
			'bash',
			'zsh',
			'fish',
			'ps1',
		];
		if (codeExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>';
		}

		// Markup/Config files
		const markupExts = [
			'html',
			'xml',
			'json',
			'yaml',
			'yml',
			'toml',
			'ini',
			'cfg',
			'conf',
			'config',
			'env',
		];
		if (markupExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>';
		}

		// Stylesheets
		const styleExts = ['css', 'scss', 'sass', 'less', 'styl'];
		if (styleExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>';
		}

		// Documents
		const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'tex', 'wpd', 'pages'];
		if (docExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';
		}

		// Spreadsheets
		const spreadsheetExts = ['xls', 'xlsx', 'csv', 'ods', 'numbers', 'tsv'];
		if (spreadsheetExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
		}

		// Presentations
		const presentationExts = ['ppt', 'pptx', 'odp', 'key'];
		if (presentationExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>';
		}

		// Archives
		const archiveExts = [
			'zip',
			'rar',
			'7z',
			'tar',
			'gz',
			'bz2',
			'xz',
			'tgz',
			'tbz2',
			'zipx',
			'iso',
		];
		if (archiveExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>';
		}

		// Database
		const dbExts = ['sql', 'db', 'sqlite', 'sqlite3', 'mdb', 'accdb'];
		if (dbExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>';
		}

		// Fonts
		const fontExts = ['ttf', 'otf', 'woff', 'woff2', 'eot'];
		if (fontExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>';
		}

		// Executables
		const execExts = ['exe', 'app', 'dmg', 'pkg', 'deb', 'rpm', 'apk', 'msi', 'bin'];
		if (execExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
		}

		// Markdown
		const markdownExts = ['md', 'markdown', 'mdx'];
		if (markdownExts.includes(ext)) {
			return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
		}

		return this.getDefaultIcon();
	}

	private getDefaultIcon(): string {
		return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
	}

	private showUploadDialog(): void {
		const dialog = this.$<HTMLDivElement>(`#upload-dialog-${this.triggerId}`);
		const dialogContent = this.$<HTMLDivElement>(`#upload-dialog-content-${this.triggerId}`);
		const cancelBtn = this.$<HTMLButtonElement>(`#upload-dialog-cancel-${this.triggerId}`);
		const confirmBtn = this.$<HTMLButtonElement>(`#upload-dialog-confirm-${this.triggerId}`);

		if (!dialog || !dialogContent) return;

		// Build file list with input fields
		let html = '<div class="storage-browser-upload-files">';
		this.pendingFiles.forEach((file, index) => {
			const timestamp = Date.now();
			const defaultName = `${timestamp}-${file.name}`;
			html += `
                <div class="storage-browser-upload-file-item">
                    <label for="upload-name-${this.triggerId}-${index}">
                        <strong>${this.t('original')}:</strong> ${file.name}
                        <span class="storage-browser-file-size">(${this.formatBytes(file.size)})</span>
                    </label>
                    <input 
                        type="text" 
                        id="upload-name-${this.triggerId}-${index}" 
                        class="storage-browser-filename-input" 
                        value="${defaultName}"
                        data-file-index="${index}"
                        aria-label="${this.t('filenameForLabel').replace('{name}', file.name)}"
                    />
                </div>
            `;
		});
		html += '</div>';
		dialogContent.innerHTML = html;

		// Show dialog
		dialog.style.display = 'flex';

		// Focus first input
		setTimeout(() => {
			const firstInput = dialogContent.querySelector<HTMLInputElement>('input');
			firstInput?.focus();
			firstInput?.select();
		}, 100);

		// Cancel handler
		const handleCancel = () => {
			dialog.style.display = 'none';
			this.pendingFiles = [];
		};

		cancelBtn?.addEventListener('click', handleCancel, { once: true });
		dialog
			.querySelector('.storage-browser-overlay')
			?.addEventListener('click', handleCancel, { once: true });

		// Confirm handler
		confirmBtn?.addEventListener(
			'click',
			async () => {
				const customNames: { [key: number]: string } = {};
				dialogContent
					.querySelectorAll<HTMLInputElement>('.storage-browser-filename-input')
					.forEach((input) => {
						const index = Number.parseInt(input.dataset.fileIndex || '0', 10);
						customNames[index] = input.value;
					});

				dialog.style.display = 'none';
				await this.uploadFilesWithCustomNames(customNames);
				this.pendingFiles = [];
			},
			{ once: true }
		);

		// Escape key handler
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && dialog.style.display === 'flex') {
				handleCancel();
				document.removeEventListener('keydown', handleEscape);
			}
		};
		document.addEventListener('keydown', handleEscape);
	}

	private showDeleteFolderConfirmation(folderName: string): void {
		const dialog = this.$<HTMLDivElement>(`#delete-dialog-${this.triggerId}`);
		const filenameEl = dialog?.querySelector<HTMLParagraphElement>(
			'.storage-browser-delete-filename'
		);
		const cancelBtn = this.$<HTMLButtonElement>(`#delete-dialog-cancel-${this.triggerId}`);
		const confirmBtn = this.$<HTMLButtonElement>(`#delete-dialog-confirm-${this.triggerId}`);

		if (!dialog || !filenameEl) return;

		filenameEl.textContent = `${folderName}/ (${this.t('andAllItsContents')})`;

		// Show dialog
		dialog.style.display = 'flex';

		// Focus cancel button
		setTimeout(() => cancelBtn?.focus(), 100);

		// Cancel handler
		const handleCancel = () => {
			dialog.style.display = 'none';
		};

		cancelBtn?.addEventListener('click', handleCancel, { once: true });
		dialog
			.querySelector('.storage-browser-overlay')
			?.addEventListener('click', handleCancel, { once: true });

		// Confirm handler
		confirmBtn?.addEventListener(
			'click',
			async () => {
				dialog.style.display = 'none';
				await this.deleteFolder(folderName);
			},
			{ once: true }
		);

		// Escape key handler
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && dialog.style.display === 'flex') {
				handleCancel();
				document.removeEventListener('keydown', handleEscape);
			}
		};
		document.addEventListener('keydown', handleEscape);
	}

	private showDeleteConfirmation(file: StorageFile): void {
		this.fileToDelete = file;
		const dialog = this.$<HTMLDivElement>(`#delete-dialog-${this.triggerId}`);
		const filenameEl = dialog?.querySelector<HTMLParagraphElement>(
			'.storage-browser-delete-filename'
		);
		const cancelBtn = this.$<HTMLButtonElement>(`#delete-dialog-cancel-${this.triggerId}`);
		const confirmBtn = this.$<HTMLButtonElement>(`#delete-dialog-confirm-${this.triggerId}`);

		if (!dialog || !filenameEl) return;

		const fileName = file.key.split('/').pop();
		const displayName = this.formatFileName(fileName);
		filenameEl.textContent = displayName;

		// Show dialog
		dialog.style.display = 'flex';

		// Focus cancel button
		setTimeout(() => cancelBtn?.focus(), 100);

		// Cancel handler
		const handleCancel = () => {
			dialog.style.display = 'none';
			this.fileToDelete = null;
		};

		cancelBtn?.addEventListener('click', handleCancel, { once: true });
		dialog
			.querySelector('.storage-browser-overlay')
			?.addEventListener('click', handleCancel, { once: true });

		// Confirm handler
		confirmBtn?.addEventListener(
			'click',
			async () => {
				dialog.style.display = 'none';
				if (this.fileToDelete) {
					await this.deleteFile(this.fileToDelete);
				}
				this.fileToDelete = null;
			},
			{ once: true }
		);

		// Escape key handler
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && dialog.style.display === 'flex') {
				handleCancel();
				document.removeEventListener('keydown', handleEscape);
			}
		};
		document.addEventListener('keydown', handleEscape);
	}

	private async deleteFile(file: StorageFile): Promise<void> {
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return;

		content.innerHTML = `<div class="storage-browser-loading" role="status">${this.t('deletingFile')}</div>`;

		try {
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete', key: file.key }),
			});

			if (!response.ok) {
				throw new Error('Delete failed');
			}

			// Reload files
			await this.loadFiles();
		} catch (error) {
			console.error('Delete error:', error);
			content.innerHTML = `
                <div class="storage-browser-error" role="alert">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedToDeleteFile')}</p>
                    <p style="font-size: 0.875rem; opacity: 0.7;">${error instanceof Error ? error.message : this.t('unknownError')}</p>
                </div>
            `;
			setTimeout(() => this.loadFiles(), 2000);
		}
	}

	private async renameFolder(oldName: string, newName: string): Promise<void> {
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return;

		content.innerHTML = `
            <div class="storage-browser-loading" role="status" aria-live="polite">
                <div class="storage-browser-spinner" aria-hidden="true"></div>
                <p>${this.t('renamingFolder')}</p>
            </div>
        `;

		try {
			// Sanitize new folder name
			const sanitized = newName.replace(/[^a-zA-Z0-9-_]/g, '-');
			const oldPrefix = `${this.currentPath + oldName}/`;
			const newPrefix = `${this.currentPath + sanitized}/`;

			// Get all files in the folder
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'list', prefix: oldPrefix }),
			});

			if (!response.ok) throw new Error('Failed to list folder contents');

			const result = await response.json();

			// Check both possible response structures
			const files = result.files || result.data?.files || [];

			// Rename each file in the folder
			for (const file of files) {
				const relativePath = file.key.substring(oldPrefix.length);
				const newKey = newPrefix + relativePath;

				const renameResponse = await fetch(this.apiEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'rename',
						key: file.key,
						newKey: newKey,
					}),
				});

				if (!renameResponse.ok) {
					const error = await renameResponse.json();
					console.error('Failed to rename file:', file.key, error);
				}
			}

			await this.loadFiles();
		} catch (error) {
			console.error('Rename folder error:', error);
			content.innerHTML = `
                <div class="storage-browser-error" role="alert">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedToRenameFolder')}</p>
                </div>
            `;
			setTimeout(() => this.loadFiles(), 2000);
		}
	}

	private async deleteFolder(folderName: string): Promise<void> {
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return;

		content.innerHTML = `
            <div class="storage-browser-loading" role="status" aria-live="polite">
                <div class="storage-browser-spinner" aria-hidden="true"></div>
                <p>${this.t('deletingFolder')}</p>
            </div>
        `;

		try {
			const prefix = `${this.currentPath + folderName}/`;

			// Get all files in the folder
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'list', prefix: prefix }),
			});

			if (!response.ok) throw new Error('Failed to list folder contents');

			const result = await response.json();

			// Check both possible response structures
			const files = result.files || result.data?.files || [];

			// Delete each file in the folder
			for (const file of files) {
				const deleteResponse = await fetch(this.apiEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'delete', key: file.key }),
				});

				if (!deleteResponse.ok) {
					const error = await deleteResponse.json();
					console.error('Failed to delete file:', file.key, error);
				}
			}

			await this.loadFiles();
		} catch (error) {
			console.error('Delete folder error:', error);
			content.innerHTML = `
                <div class="storage-browser-error" role="alert">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedToDeleteFolder')}</p>
                </div>
            `;
			setTimeout(() => this.loadFiles(), 2000);
		}
	}

	private showCreateFolderDialog(): void {
		const folderDialog = this.$<HTMLDivElement>(`#folder-dialog-${this.triggerId}`);
		const folderNameInput = this.$<HTMLInputElement>(`#folder-name-input-${this.triggerId}`);

		if (folderDialog && folderNameInput) {
			folderDialog.style.display = 'flex';
			folderNameInput.value = '';
			setTimeout(() => folderNameInput.focus(), 100);
		}
	}

	private async createFolder(folderName: string): Promise<void> {
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return;

		content.innerHTML = `<div class="storage-browser-loading" role="status">${this.t('creatingFolder')}</div>`;

		try {
			// Sanitize folder name
			const sanitized = folderName.replace(/[^a-zA-Z0-9-_]/g, '-');
			const folderKey = `${this.currentPath}${sanitized}/.folder`;

			// Create a placeholder file to establish the folder (same as index.astro)
			const response = await fetch(this.apiEndpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'text/plain',
					'x-storage-key': folderKey,
				},
				body: '',
			});

			if (!response.ok) {
				throw new Error('Create folder failed');
			}

			// Reload files
			await this.loadFiles();
		} catch (error) {
			console.error('Create folder error:', error);
			content.innerHTML = `
                <div class="storage-browser-error" role="alert">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedToCreateFolder')}</p>
                    <p style="font-size: 0.875rem; opacity: 0.7;">${error instanceof Error ? error.message : this.t('unknownError')}</p>
                </div>
            `;
			setTimeout(() => this.loadFiles(), 2000);
		}
	}

	private async uploadFilesWithCustomNames(customNames: { [key: number]: string }): Promise<void> {
		if (this.isUploading) return;

		// Ensure names do not contain illegal characters
		const status = { valid: true, invalidFiles: [] as string[] };

		this.pendingFiles.forEach((file, index) => {
			const customName = customNames[index];
			if (customName && !s3SafeNameRegex.test(customName)) {
				status.valid = false;
				status.invalidFiles.push(file.name);
			}
		});

		if (!status.valid) {
			throw new InvalidFileNameError(status.invalidFiles);
		}

		this.isUploading = true;
		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return;

		const totalFiles = this.pendingFiles.length;
		let completedFiles = 0;

		content.innerHTML = `
            <div class="storage-browser-uploading" role="status" aria-live="polite">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>${this.t('uploadingFiles')}</p>
                <div class="storage-browser-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${totalFiles}" aria-valuenow="0" aria-label="${this.t('uploadProgressLabel')}">
                    <div class="storage-browser-progress-bar" style="width: 0%"></div>
                </div>
                <p class="storage-browser-progress-text" aria-live="polite">${this.t('uploadProgress').replace('{current}', '0').replace('{total}', totalFiles.toString())}</p>
            </div>
        `;

		const progressBar = content.querySelector<HTMLDivElement>('.storage-browser-progress-bar');
		const progressText = content.querySelector<HTMLParagraphElement>(
			'.storage-browser-progress-text'
		);

		try {
			for (let i = 0; i < this.pendingFiles.length; i++) {
				const file = this.pendingFiles[i];
				const customName = customNames[i] || `${Date.now()}-${file.name}`;
				await this.uploadSingleFile(file, customName);
				completedFiles++;

				const progress = (completedFiles / totalFiles) * 100;
				if (progressBar) {
					progressBar.style.width = `${progress}%`;
					const progressContainer = progressBar.parentElement;
					progressContainer?.setAttribute('aria-valuenow', completedFiles.toString());
				}
				if (progressText)
					progressText.textContent = this.t('uploadProgress')
						.replace('{current}', completedFiles.toString())
						.replace('{total}', totalFiles.toString());
			}

			// Reload files after upload
			await this.loadFiles();
		} catch (error) {
			console.error('Upload error:', error);

			let errorMessage = this.t('failedToUploadFiles');

			if (error instanceof Error) {
				errorMessage = error.message;
			}

			content.innerHTML = `
                <div class="storage-browser-error" role="alert" aria-live="assertive">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedToUploadFiles')}</p>
                    <p style="font-size: 0.875rem; opacity: 0.7;">${errorMessage}</p>
                </div>
            `;
		} finally {
			this.isUploading = false;
		}
	}

	private async uploadSingleFile(file: File, customName?: string): Promise<void> {
		const fileName = customName || `${Date.now()}-${file.name}`;
		const key = this.currentPath ? `${this.currentPath}${fileName}` : fileName;

		// Upload directly using PUT endpoint
		const response = await fetch(this.apiEndpoint, {
			method: 'PUT',
			headers: {
				'Content-Type': file.type || 'application/octet-stream',
				'x-storage-key': key,
			},
			body: file,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Upload failed');
		}
	}

	private showRenameFolderDialog(folderName: string): void {
		const dialog = this.$<HTMLDivElement>(`#rename-dialog-${this.triggerId}`);
		const fileNameDisplay = this.$<HTMLSpanElement>(`#rename-current-name-${this.triggerId}`);
		const input = this.$<HTMLInputElement>(`#rename-input-${this.triggerId}`);
		const confirmBtn = this.$<HTMLButtonElement>(`#rename-confirm-btn-${this.triggerId}`);
		const cancelBtn = this.$<HTMLButtonElement>(`#rename-cancel-btn-${this.triggerId}`);

		if (!dialog || !fileNameDisplay || !input || !confirmBtn || !cancelBtn) return;

		// Display current folder name
		fileNameDisplay.textContent = folderName;
		input.value = folderName;

		// Show dialog
		dialog.style.display = 'flex';
		setTimeout(() => {
			input.focus();
			input.select();
		}, 100);

		// Remove any existing event listeners by cloning and replacing the buttons
		const newCancelBtn = cancelBtn.cloneNode(true) as HTMLButtonElement;
		const newConfirmBtn = confirmBtn.cloneNode(true) as HTMLButtonElement;
		cancelBtn.replaceWith(newCancelBtn);
		confirmBtn.replaceWith(newConfirmBtn);

		// Cancel handler
		newCancelBtn.addEventListener('click', () => {
			dialog.style.display = 'none';
			input.value = '';
		});

		dialog.querySelector('.storage-browser-overlay')?.addEventListener(
			'click',
			() => {
				dialog.style.display = 'none';
				input.value = '';
			},
			{ once: true }
		);

		// Enter key handler
		input.addEventListener(
			'keydown',
			(e: KeyboardEvent) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					newConfirmBtn.click();
				}
			},
			{ once: true }
		);

		// Confirm handler
		newConfirmBtn.addEventListener('click', async () => {
			const newFolderName = input.value.trim();
			if (!newFolderName) return;

			dialog.style.display = 'none';
			await this.renameFolder(folderName, newFolderName);
		});
	}

	private showRenameDialog(file: StorageFile): void {
		this.fileToRename = file;

		const dialog = this.$<HTMLDivElement>(`#rename-dialog-${this.triggerId}`);
		const fileNameDisplay = this.$<HTMLSpanElement>(`#rename-current-name-${this.triggerId}`);
		const input = this.$<HTMLInputElement>(`#rename-input-${this.triggerId}`);
		const confirmBtn = this.$<HTMLButtonElement>(`#rename-confirm-btn-${this.triggerId}`);
		const cancelBtn = this.$<HTMLButtonElement>(`#rename-cancel-btn-${this.triggerId}`);

		if (!dialog || !fileNameDisplay || !input || !confirmBtn || !cancelBtn) return;

		// Extract current filename without timestamp prefix
		const currentFileName = file.key.split('/').pop() || '';
		const fileNameWithoutTimestamp = currentFileName.replace(/^\d+-/, '');

		// Display current filename
		fileNameDisplay.textContent = currentFileName;

		// Pre-fill input with filename without timestamp
		input.value = fileNameWithoutTimestamp;

		// Show dialog
		dialog.style.display = 'flex';

		// Focus and select input
		setTimeout(() => {
			input.focus();
			input.select();
		}, 100);

		// Remove any existing event listeners by cloning and replacing the buttons
		const newCancelBtn = cancelBtn.cloneNode(true) as HTMLButtonElement;
		const newConfirmBtn = confirmBtn.cloneNode(true) as HTMLButtonElement;
		cancelBtn.replaceWith(newCancelBtn);
		confirmBtn.replaceWith(newConfirmBtn);

		// Cancel handler
		newCancelBtn.addEventListener('click', () => {
			dialog.style.display = 'none';
			this.fileToRename = null;
			input.value = '';
		});

		dialog.querySelector('.storage-browser-overlay')?.addEventListener(
			'click',
			() => {
				dialog.style.display = 'none';
				this.fileToRename = null;
				input.value = '';
			},
			{ once: true }
		);

		// Enter key handler
		input.addEventListener(
			'keydown',
			(e: KeyboardEvent) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					newConfirmBtn.click();
				}
			},
			{ once: true }
		);

		// Confirm handler
		newConfirmBtn.addEventListener('click', async () => {
			const newFileName = input.value.trim();
			if (!newFileName) return;

			dialog.style.display = 'none';
			await this.renameFile(newFileName);
		});
	}

	private async renameFile(newFileName: string): Promise<void> {
		if (!this.fileToRename) return;

		const content = this.$<HTMLDivElement>(`#${this.contentId}`);
		if (!content) return; // Show loading
		content.innerHTML = `
            <div class="storage-browser-loading" role="status" aria-live="polite">
                <div class="storage-browser-spinner" aria-hidden="true"></div>
                <p>${this.t('renamingFile')}</p>
            </div>
        `;
		try {
			if (!s3SafeNameRegex.test(newFileName)) {
				throw new InvalidFileNameError([newFileName]);
			}

			// Build new key with timestamp prefix
			const pathParts = this.fileToRename.key.split('/');
			const _oldFileName = pathParts.pop() || '';
			const path = pathParts.length > 0 ? `${pathParts.join('/')}/` : '';
			const newKey = `${path}${Date.now()}-${newFileName}`;

			console.log('Renaming file:', {
				oldKey: this.fileToRename.key,
				newKey: newKey,
				action: 'rename',
			});

			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'rename',
					key: this.fileToRename.key,
					newKey: newKey,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Rename failed');
			}

			// Reload files
			await this.loadFiles();
		} catch (error) {
			console.error('Rename error:', error);

			let errorMessage = this.t('unknownError');

			if (error instanceof Error) {
				errorMessage = error.message;
			}

			content.innerHTML = `
                <div class="storage-browser-error" role="alert">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>${this.t('failedToRenameFile')}</p>
                    <p style="font-size: 0.875rem; opacity: 0.7;">${errorMessage}</p>
                </div>
            `;
			setTimeout(() => this.loadFiles(), 2000);
		} finally {
			this.fileToRename = null;
		}
	}

	private isFilePreviewable(ext: string | undefined): boolean {
		if (!ext) return false;

		const previewableExtensions = [
			// Images
			'jpg',
			'jpeg',
			'png',
			'gif',
			'webp',
			'svg',
			'bmp',
			'ico',
			// Documents
			'pdf',
			'txt',
			'md',
			'json',
			'xml',
			'csv',
			// Code
			'html',
			'css',
			'js',
			'ts',
			'jsx',
			'tsx',
			'vue',
			'astro',
			// Video
			'mp4',
			'webm',
			'ogg',
			// Audio
			'mp3',
			'wav',
			'ogg',
			'm4a',
		];

		return previewableExtensions.includes(ext.toLowerCase());
	}

	private async showPreview(file: StorageFile): Promise<void> {
		const dialog = this.$<HTMLDivElement>(`#preview-dialog-${this.triggerId}`);
		const content = this.$<HTMLDivElement>(`#preview-content-${this.triggerId}`);
		const loading = this.$<HTMLDivElement>(`#preview-loading-${this.triggerId}`);
		const closeBtn = this.$<HTMLButtonElement>(`#preview-close-btn-${this.triggerId}`);
		const downloadBtn = this.$<HTMLAnchorElement>(`#preview-download-btn-${this.triggerId}`);
		const title = this.$<HTMLHeadingElement>(`#preview-dialog-title-${this.triggerId}`);

		if (!dialog || !content || !loading || !closeBtn || !downloadBtn || !title) {
			console.error('Preview dialog elements not found');
			return;
		}

		// Clear all previous content first (except loading indicator)
		const children = Array.from(content.children);
		children.forEach((child) => {
			if (child !== loading) {
				content.removeChild(child);
			}
		});

		// Reset download button
		downloadBtn.href = '';
		downloadBtn.removeAttribute('download');

		// Show dialog and loading state
		dialog.style.display = 'flex';
		loading.style.display = 'flex';

		// Get file info
		const fileName = file.key.split('/').pop() || 'File';
		const fileExt = fileName.split('.').pop()?.toLowerCase();
		const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(
			fileExt || ''
		);

		try {
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'publicUrl', key: file.key }),
			});

			if (!response.ok) throw new Error('Failed to get file URL');

			const result = await response.json();
			const fileUrl = result.url;

			if (!fileUrl) {
				throw new Error('No URL returned from API');
			}

			// Update dialog title and download button
			title.textContent = fileName;
			downloadBtn.href = fileUrl;
			downloadBtn.download = fileName;

			// Render preview based on file type
			if (isImage) {
				// Use direct image rendering for better display
				const img = document.createElement('img');
				img.className = 'storage-browser-preview-image';
				img.alt = fileName;
				img.onload = () => {
					loading.style.display = 'none';
				};
				img.onerror = () => {
					loading.style.display = 'none';
					const errorDiv = document.createElement('div');
					errorDiv.className = 'storage-browser-preview-error';
					errorDiv.textContent = this.t('failedToLoadImage');
					content.appendChild(errorDiv);
				};
				img.src = fileUrl;

				// Add image (content already cleared at start of function)
				content.appendChild(img);
			} else {
				// Use iframe for other file types
				const iframe = document.createElement('iframe');
				iframe.className = 'storage-browser-preview-iframe';
				iframe.sandbox.add('allow-same-origin', 'allow-scripts');
				iframe.title = this.t('filePreview');
				iframe.onload = () => {
					loading.style.display = 'none';
				};
				iframe.src = fileUrl;

				// Add iframe (content already cleared at start of function)
				content.appendChild(iframe);
			}

			// Close handler
			const handleClose = () => {
				dialog.style.display = 'none';

				// Clear all content except loading indicator
				const children = Array.from(content.children);
				children.forEach((child) => {
					if (child !== loading) {
						content.removeChild(child);
					}
				});

				// Reset download button
				downloadBtn.href = '';
				downloadBtn.removeAttribute('download');

				// Reset loading state
				loading.style.display = 'flex';
			};

			closeBtn.addEventListener('click', handleClose, { once: true });
			dialog
				.querySelector('.storage-browser-overlay')
				?.addEventListener('click', handleClose, { once: true });

			// ESC key handler
			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					handleClose();
					document.removeEventListener('keydown', handleEsc);
				}
			};
			document.addEventListener('keydown', handleEsc);
		} catch (error) {
			console.error('Preview error:', error);
			loading.style.display = 'none';
			content.innerHTML = `<div class="storage-browser-preview-error">${this.t('failedToPreviewFile')}: ${error instanceof Error ? error.message : this.t('unknownError')}</div>`;
		}
	}
}

// Register the custom element
if (!customElements.get('storage-file-browser')) {
	customElements.define('storage-file-browser', StorageFileBrowser);
}
