import { db } from 'studiocms:config';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick, createAppElement } from '../utils/app-utils.js';
import { DbStudioElement } from './viewer.js';

/**
 * Application configuration type.
 */
type AppConfig = {
	dialect: 'sqlite' | 'postgres' | 'mysql';
};

/**
 * Default application configuration.
 */
const DEFAULT_CONFIG: AppConfig = {
	dialect: 'sqlite',
};

/**
 * Mapping of supported database dialects to application dialects.
 */
const dialectMap: Record<string, AppConfig['dialect']> = {
	sqlite: 'sqlite',
	libsql: 'sqlite',
	turso: 'sqlite',
	postgres: 'postgres',
	mysql: 'mysql',
};

/**
 * Retrieves the application configuration based on the database settings.
 *
 * @returns {AppConfig} The application configuration.
 */
const getConfig = (): AppConfig => {
	if (db?.dialect && dialectMap[db.dialect]) {
		return {
			...DEFAULT_CONFIG,
			dialect: dialectMap[db.dialect],
		};
	}
	return DEFAULT_CONFIG;
};

export default defineToolbarApp({
	init(canvas, eventTarget) {
		function createCanvas() {
			// Get user config
			const userConfig = getConfig();

			// Create HTML string for the app element
			const htmlString = `<style> db-studio { width: 100%; height: 100%; border: 1px solid rgba(27, 30, 36, 1); } </style> <db-studio dialect="${userConfig.dialect}"></db-studio>`;

			// Create the app element with specified styles
			const AppElement = createAppElement(htmlString, {
				width: '90%',
				height: '100%',
				marginLeft: '1rem',
				marginRight: '1rem',
				padding: '0',
				border: 'none',
				overflow: 'hidden',
				borderRadius: '0.5rem',
				boxShadow: '0 0 1rem rgba(0, 0, 0, 0.1)',
			});

			// Define the custom element if not already defined
			if (!customElements.get('db-studio')) {
				customElements.define('db-studio', DbStudioElement);
			}

			// Append the app element to the canvas
			canvas.appendChild(AppElement);
		}

		createCanvas();
		document.addEventListener('astro:after-swap', createCanvas);
		closeOnOutsideClick(eventTarget);
	},
});
