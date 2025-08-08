/**
 * The endpoint path for the WYSIWYG editor's partial HTML file.
 * This file contains the structure of the WYSIWYG editor's UI.
 */
export const PARTIAL_PATH = '/studiocms_api/wysiwyg_editor/partial';

/**
 * The endpoint path for the WYSIWYG editor's CSS file.
 * This file contains styles specific to the WYSIWYG editor.
 */
export const GRAPES_CSS_PATH = '/studiocms_api/wysiwyg_editor/grapes.css';

/**
 * The endpoint path for storing WYSIWYG editor data.
 * This endpoint is used to save the state of the WYSIWYG editor,
 * allowing users to persist their content.
 */
export const STORE_ENDPOINT_PATH = '/studiocms_api/wysiwyg_editor/store';

/**
 * The unique identifier for the WYSIWYG plugin within the StudioCMS ecosystem.
 * Used to register and reference the plugin in the system.
 */
export const TABLE_PLUGIN_ID = 'studiocms-wysiwyg';