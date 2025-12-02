// src/middleware.ts

import logger from 'studiocms:logger';
import type { MiddlewareHandler } from 'astro';
import { renderErrorTemplate } from './templates/errors.js';

/**
 * Formats an error into a readable string with a prefix.
 *
 * @param prefix - A string prefix to describe the context of the error.
 * @param error - The error object to format.
 * @returns A formatted string containing the prefix and error details.
 */
function prettyPrintError(prefix: string, error: unknown): string {
	if (error instanceof Error) {
		return `${prefix}: ${error.message}\n\n${error.stack ?? ''}`;
	}
	return `${prefix}: ${String(error)}`;
}

/**
 * Middleware to handle errors and return a custom HTML error page.
 *
 * Catches any errors thrown during request processing, logs the error,
 * and returns a formatted HTML error page with relevant details.
 *
 * @param _ - The incoming request context (not used).
 * @param next - The next middleware or page handler in the chain.
 * @returns A Response object, either from the next handler or a custom error page.
 */
export const onRequest: MiddlewareHandler = async (_, next) => {
	try {
		// Continue to the next middleware or page
		const response = await next();
		return response;
	} catch (error) {
		logger.error(prettyPrintError('Server error caught in middleware', error));

		// Get error details
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : '';

		const responseData = renderErrorTemplate(
			{ message: errorMessage, stack: escapeHtml(errorStack ?? '') },
			import.meta.env.DEV
		);

		// Return a custom HTML error page
		return new Response(responseData, {
			status: 500,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
			},
		});
	}
};

// Helper function to escape HTML
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, (char) => map[char]);
}
