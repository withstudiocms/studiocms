import path from 'node:path';
import type { AstroIntegrationLogger } from 'astro';
import type { RobotsConfig } from './types.js';

/**
 * Validates the given host string against a specific pattern and logs errors if the validation fails.
 *
 * @param host - The host string to be validated.
 * @param logger - The logger instance used to log error messages.
 * @throws Will throw an error if the host is not a string or if it does not match the required pattern.
 */
function validateHost(host: string, logger: AstroIntegrationLogger) {
	const hostPattern = /^(?=.{1,253}$)(?:(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$/;

	if (typeof host !== 'string') {
		throwMsg('Host must be a string', 'error', logger);
	}

	if (!hostPattern.test(host)) {
		throwMsg('Host is invalid', 'error', logger);
	}
}

/**
 * Generates the host content for the robots.txt file based on the provided configuration.
 *
 * @param {RobotsConfig} config - The configuration object for generating the host content.
 * @param {AstroIntegrationLogger} logger - The logger instance for logging validation messages.
 * @returns {string} The generated host content for the robots.txt file.
 *
 * @remarks
 * - If `config.host` is `true`, the default host is used.
 * - If `config.host` is `false`, the host is not specified.
 * - If `config.host` is a number, it is validated and used.
 * - If `config.host` is a string and not 'localhost', it is validated and used.
 */
function generateHostContent(config: RobotsConfig, logger: AstroIntegrationLogger) {
	let content = '';

	if (config.host === true) {
		// use default host
	} else if (config.host === false) {
		// do not specify host
	} else if (typeof config.host === 'number') {
		validateHost(config.host, logger);
	} else if (typeof config.host === 'string' && config.host !== 'localhost') {
		validateHost(config.host, logger);

		content += `Host: ${config.host}\n`;
	}

	return content;
}

/**
 * Validates the given URL to ensure it is a valid sitemap file URL.
 *
 * The URL must start with "http" or "https" and end with one of the following extensions:
 * - .xml
 * - .txt
 * - .html
 * - .xml.gz
 * - .txt.gz
 * - .json
 * - .xhtml
 *
 * If the URL is invalid, an error message is logged and an exception is thrown.
 *
 * @param url - The URL to validate.
 * @param logger - The logger instance to use for logging error messages.
 * @throws Will throw an error if the URL is invalid or not a valid sitemap file.
 */
function validateUrl(url: string, logger: AstroIntegrationLogger) {
	// const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*\.(xml|txt|html)$/;
	const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*\.(xml|txt|html|xml.gz|txt.gz|json|xhtml)$/i;
	if (!urlPattern.test(url)) {
		throwMsg('sitemap [URL is invalid or not a valid sitemap file.]', true, logger);
	}
}

/**
 * Generates the content for the sitemap based on the provided configuration.
 *
 * @param {RobotsConfig} config - The configuration object for the robots.txt file.
 * @param {string} siteHref - The base URL of the site.
 * @param {AstroIntegrationLogger} logger - The logger instance for logging messages.
 * @returns {string} The generated sitemap content.
 * @throws Will throw an error if the sitemap configuration is an invalid number.
 */
function generateSitemapContent(
	config: RobotsConfig,
	siteHref: string,
	logger: AstroIntegrationLogger
) {
	let content = '';

	if (config.sitemap === true) {
		content += `Sitemap: ${siteHref}sitemap-index.xml\n`;
	} else if (typeof config.sitemap === 'number') {
		throwMsg('sitemap [URL is invalid or not a valid sitemap file.]', true, logger);
	} else if (typeof config.sitemap === 'string') {
		validateUrl(config.sitemap, logger);
		content += `Sitemap: ${config.sitemap}\n`;
	} else if (Array.isArray(config.sitemap)) {
		for (const url of config.sitemap) {
			validateUrl(url, logger);
			content += `Sitemap: ${url}\n`;
		}
	}

	return content;
}

/**
 * Throws a message with a specific type and logs it using the provided logger.
 *
 * @param msg - The message to be logged and thrown.
 * @param type - The type of the message. It can be a boolean, 'warn', 'error', or 'info'.
 *               - 'warn': Logs a warning message.
 *               - 'error': Logs a failure message and throws an error with the message.
 *               - true: Logs a failure message and throws an error with the message and a reference link to Google's robots.txt rules.
 *               - default: Logs a failure message and throws an error with the message and a reference link to Yandex's robots.txt rules.
 * @param logger - The logger instance used to log the messages.
 */
function throwMsg(
	msg: string,
	type: boolean | 'warn' | 'error' | 'info',
	logger: AstroIntegrationLogger
) {
	const sentenceHead = '\x1b[1mRefer:\x1b[22m';

	const failure = (message: string) => {
		logger.info(`\x1b[31mFailure! [${message}]\x1b[39m`);
	};

	const warn = (message: string) => {
		logger.warn(`Skipped! [${message}].`);
	};

	switch (type) {
		case 'warn':
			warn(msg);
			break;
		case 'error':
			failure(msg);
			throw new Error(`${msg}`);
		case true:
			failure(msg);
			throw new Error(
				`${msg}\n${sentenceHead}\n  Visit \x1b[4m${'https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt#useful-robots.txt-rules'}\x1b[24m for instructions.`
			);
		default:
			failure(msg);
			throw new Error(
				`${msg}\n${sentenceHead}\n  Visit \x1b[4m${'https://yandex.com/support/webmaster/controlling-robot/robots-txt.html#recommend'}\x1b[24m for instructions.`
			);
	}
}

/**
 * Generates the content for the robots.txt file based on the provided configuration.
 *
 * @param {RobotsConfig} config - The configuration object for generating the robots.txt content.
 * @param {string} siteMapHref - The URL of the sitemap.
 * @param {AstroIntegrationLogger} logger - The logger instance for logging messages.
 * @returns {string} The generated content for the robots.txt file.
 *
 * @throws Will throw an error if any policy is missing a required userAgent,
 *         if both allow and disallow entries are missing or empty,
 *         if crawlDelay is not a number or is out of the allowed range (0.1 to 60 seconds).
 */
export function generateContent(
	config: RobotsConfig,
	siteMapHref: string,
	logger: AstroIntegrationLogger
): string {
	let content = '';

	for (const policy of config.policy ?? []) {
		// Basic validate
		config?.policy?.forEach((policy, index) => {
			if (!policy.userAgent) {
				throwMsg(
					`policy[${index}].userAgent [Required, one or more per group].\n${JSON.stringify(policy, null, 2)}`,
					!!policy.userAgent,
					logger
				);
			}

			if (
				(!policy.allow && !policy.disallow) ||
				(policy.allow?.length === 0 && policy.disallow?.length === 0)
			) {
				throwMsg(
					`policy[${index}] [At least one or more 'disallow' or 'allow' entries per rule].\n${JSON.stringify(policy, null, 2)}`,
					!policy.allow && !policy.disallow,
					logger
				);
			}

			if (policy.crawlDelay && typeof policy.crawlDelay !== 'number') {
				throwMsg(
					`policy[${index}].crawlDelay [Must be number].\n${JSON.stringify(policy, null, 2)}`,
					false,
					logger
				);
			} else if (policy.crawlDelay !== undefined && policy?.crawlDelay < 0) {
				throwMsg(
					`policy[${index}].crawlDelay [Must be a positive number].\n${JSON.stringify(policy, null, 2)}`,
					false,
					logger
				);
			} else if (
				policy.crawlDelay !== undefined &&
				(policy?.crawlDelay < 0.1 || policy.crawlDelay > 60)
			) {
				throwMsg(
					`policy[${index}].crawlDelay [Must be between 0.1 and 60 seconds].\n${JSON.stringify(policy, null, 2)}`,
					false,
					logger
				);
			}
		});

		if (policy.userAgent) {
			const userAgents = Array.isArray(policy.userAgent)
				? policy.userAgent
				: [policy.userAgent || '*'];
			for (const userAgent of userAgents) {
				// skipped
				if (userAgent) {
					content += `User-agent: ${userAgent}\n`;
				}
			}
		}

		if (policy.allow) {
			const allowPaths = Array.isArray(policy.allow) ? policy.allow : [policy.allow];
			for (const path of allowPaths) {
				content += `Allow: ${path}\n`;
			}
		}

		if (policy.disallow) {
			const disallowPaths = Array.isArray(policy.disallow) ? policy.disallow : [policy.disallow];
			for (const path of disallowPaths) {
				content += `Disallow: ${path}\n`;
			}
		}

		if (policy.crawlDelay) {
			content += `Crawl-delay: ${policy.crawlDelay}\n`;
		}

		if (policy.cleanParam) {
			const cleanParams = Array.isArray(policy.cleanParam)
				? policy.cleanParam
				: [policy.cleanParam];
			for (const param of cleanParams) {
				content += `Clean-param: ${param}\n`;
			}
		}

		if (config.policy && policy !== config.policy[config.policy.length - 1]) {
			content += '\n';
		} else if (config.sitemap !== false) {
			content += '\n# crawling rule(s) for above bots\n';
		}
	}

	content += generateSitemapContent(config, siteMapHref, logger);
	content += generateHostContent(config, logger);

	return content;
}

/**
 * Prints information about the generation of the 'robots.txt' file.
 *
 * @param fileSize - The size of the generated 'robots.txt' file in KB.
 * @param executionTime - The time taken to generate the 'robots.txt' file in milliseconds.
 * @param logger - The logger instance used to log information.
 * @param destDir - The destination directory where the 'robots.txt' file is created.
 */
export function printInfo(
	fileSize: number,
	executionTime: number,
	logger: AstroIntegrationLogger,
	destDir: string
) {
	if (fileSize > 10) {
		console.log(`\n\x1b[42m\x1b[30m generating 'robots.txt' file \x1b[39m\x1b[0m`);
		const warnMsg = [
			`\n\x1b[33m(!) Keep your 'robots.txt' file size under 10 KB for best crawling results.`,
			'- To keep it low, only include directives that are necessary for your site.',
			'- Remove rules for pages that no longer exist to avoid bloat.\x1b[0m\n',
		];
		console.log(`${warnMsg.join('\n')}`);
	}

	logger.info(
		`\`robots.txt\` (${fileSize}KB) created at \`${path.relative(process.cwd(), destDir)}\` in ${executionTime}ms`
	);
}
