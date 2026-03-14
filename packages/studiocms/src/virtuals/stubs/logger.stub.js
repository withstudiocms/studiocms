import { logger as _logger } from '@it-astro:logger:studiocms-runtime';

export const isVerbose = $$verbose$$;

export const logger = _logger.fork('studiocms:runtime');

export default logger;

const apiLogger = _logger.fork('studiocms:runtime/api');

function buildErrorMessage(message, error) {
	if (!error) return message;
	if (error instanceof Error) return `${message}: ${error.message}\n${error.stack}`;
	return `${message}: ${error}`;
}

export function apiResponseLogger(status, message, error) {
	if (status !== 200) {
		apiLogger.error(buildErrorMessage(message, error));
		return new Response(JSON.stringify({ error: message }), {
			status,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	isVerbose && apiLogger.info(message);
	return new Response(JSON.stringify({ message }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
