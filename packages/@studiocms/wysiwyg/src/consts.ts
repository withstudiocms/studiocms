/**
 * The base API path for the WYSIWYG editor.
 * This path is used to access the WYSIWYG editor's API endpoints.
 */
const API_BASE = '/studiocms_api/wysiwyg_editor';

/**
 * The endpoint path for the WYSIWYG editor's partial HTML file.
 * This file contains the structure of the WYSIWYG editor's UI.
 */
export const PARTIAL_PATH = `${API_BASE}/partial`;

/**
 * The endpoint path for the WYSIWYG editor's CSS file.
 * This file contains styles specific to the WYSIWYG editor.
 */
export const GRAPES_CSS_PATH = `${API_BASE}/grapes.css`;

/**
 * The endpoint path for storing WYSIWYG editor data.
 * This endpoint is used to save the state of the WYSIWYG editor,
 * allowing users to persist their content.
 */
export const STORE_ENDPOINT_PATH = `${API_BASE}/store`;

/**
 * The unique identifier for the WYSIWYG plugin within the StudioCMS ecosystem.
 * Used to register and reference the plugin in the system.
 */
export const WYSIWYG_TABLE_PLUGIN_ID = 'studiocms-wysiwyg';

/**
 * The name of the CSRF header used for WYSIWYG editor requests.
 * This header is used to validate requests and prevent CSRF attacks.
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * The name of the CSRF cookie used for WYSIWYG editor requests.
 * This cookie stores the CSRF token to be validated against incoming requests.
 */
export const CSRF_COOKIE_NAME = 'wysiwyg-csrf-token';
