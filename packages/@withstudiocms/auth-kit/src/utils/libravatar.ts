/*
 * node-libravatar: node.js module for Libravatar
 *
 * Copyright (C) 2011, 2012 Francois Marier <francois@libravatar.org> - Modified 2025-Present StudioCMS - withstudiocms (https://github.com/withstudiocms)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE."
 */

import { createHash } from 'node:crypto';
import { resolveSrv } from 'node:dns/promises';
import { stringify } from 'node:querystring';

const BASE_URL = 'http://cdn.libravatar.org/avatar/';
const SECURE_BASE_URL = 'https://seccdn.libravatar.org/avatar/';
const SERVICE_BASE = '_avatars._tcp';
const SECURE_SERVICE_BASE = '_avatars-sec._tcp';

interface SrvRecord {
	priority: number;
	weight: number;
	port: number;
	name: string;
}

interface AvatarOptions {
	email?: string;
	openid?: string;
	https?: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: Allow additional query parameters
	[key: string]: any;
}

interface UserIdentity {
	hash: string | null;
	domain: string | null;
}

type TargetComponents = [string | null, number | null];

/**
 * Return the right (target, port) pair from a list of SRV records.
 */
export const srvHostname = (records: SrvRecord[]): TargetComponents => {
	if (records.length < 1) {
		return [null, null];
	}

	/* v8 ignore next 3 */
	if (records.length === 1) {
		return [records[0].name, records[0].port];
	}

	// Keep only the servers in the top priority
	let priorityRecords: Array<[number, SrvRecord]> = [];
	let totalWeight = 0;
	let topPriority = records[0].priority; // highest priority = lowest number

	records.forEach((srvRecord) => {
		if (srvRecord.priority <= topPriority) {
			// ignore lower priority records
			/* v8 ignore next 6 */
			if (srvRecord.priority < topPriority) {
				// reset the array (srvRecord has higher priority)
				topPriority = srvRecord.priority;
				totalWeight = 0;
				priorityRecords = [];
			}

			totalWeight += srvRecord.weight;

			if (srvRecord.weight > 0) {
				priorityRecords.push([totalWeight, srvRecord]);
				/* v8 ignore next 4 */
			} else {
				// zero-weight elements must come first
				priorityRecords.unshift([0, srvRecord]);
			}
		}
	});

	if (priorityRecords.length === 1) {
		const srvRecord = priorityRecords[0][1];
		return [srvRecord.name, srvRecord.port];
	}

	// Select first record according to RFC2782 weight
	// ordering algorithm (page 3)
	const randomNumber = Math.floor(Math.random() * (totalWeight + 1));

	for (let i = 0; i < priorityRecords.length; i++) {
		const weightedIndex = priorityRecords[i][0];
		const target = priorityRecords[i][1];

		if (weightedIndex >= randomNumber) {
			return [target.name, target.port];
		}
	}

	console.log('There is something wrong with our SRV weight ordering algorithm');
	return [null, null];
};

/**
 * Ensure we are getting a (mostly) valid hostname and port number
 * from the DNS resolver and return the final hostname:port string.
 */
export const sanitizedTarget = (
	targetComponents: TargetComponents,
	https: boolean
): string | null => {
	const target = targetComponents[0];
	const port = targetComponents[1];

	if (target === null || port === null || Number.isNaN(port)) {
		return null;
	}

	if (port < 1 || port > 65535) {
		return null;
	}

	if (target.search(/^[0-9a-zA-Z\-.]+$/) === -1) {
		return null;
	}

	if (target && ((https && port !== 443) || (!https && port !== 80))) {
		return `${target}:${port}`;
	}
	return target;
};

/**
 * Generate user hash based on the email address or OpenID and return
 * it along with the relevant domain.
 */
export const parseUserIdentity = (email?: string, openid?: string): UserIdentity => {
	let hash: string | null = null;
	let domain: string | null = null;

	if (email != null) {
		const lowercaseValue = email.trim().toLowerCase();
		const emailParts = lowercaseValue.split('@');
		if (emailParts.length > 1) {
			domain = emailParts[emailParts.length - 1];
			hash = createHash('md5').update(lowercaseValue).digest('hex');
		}
	} else if (openid != null) {
		try {
			const parsedUrl = new URL(openid);
			let normalizedUrl = parsedUrl.protocol.toLowerCase();
			normalizedUrl += '//';

			if (parsedUrl.username || parsedUrl.password) {
				const auth = parsedUrl.username + (parsedUrl.password ? `:${parsedUrl.password}` : '');
				normalizedUrl += `${auth}@`;
			}

			normalizedUrl += parsedUrl.hostname.toLowerCase() + parsedUrl.pathname;

			domain = parsedUrl.hostname.toLowerCase();
			hash = createHash('sha256').update(normalizedUrl).digest('hex');
		} catch (_error) {
			// Invalid URL, return null values
			return { hash: null, domain: null };
		}
	}

	return { hash, domain };
};

/**
 * Return the DNS service to query for a given domain and scheme.
 */
export const serviceName = (domain: string | null, https: boolean): string | null => {
	if (domain) {
		return `${https ? SECURE_SERVICE_BASE : SERVICE_BASE}.${domain}`;
	}
	return null;
};

/**
 * Assemble the final avatar URL based on the provided components.
 */
export const composeAvatarUrl = (
	delegationServer: string | null,
	avatarHash: string,
	queryString: string,
	https: boolean
): string => {
	let baseUrl = https ? SECURE_BASE_URL : BASE_URL;

	if (delegationServer) {
		baseUrl = `http${https ? 's' : ''}://${delegationServer}/avatar/`;
	}

	return baseUrl + avatarHash + queryString;
};

/**
 * Get the delegation server for a given domain.
 */
export const getDelegationServer = async (
	domain: string | null,
	https: boolean
): Promise<string | null> => {
	if (!domain) {
		return null;
	}

	const service = serviceName(domain, https);
	if (!service) {
		return null;
	}

	try {
		const addresses = await resolveSrv(service);
		return sanitizedTarget(srvHostname(addresses), https);
	} catch (_error) {
		// DNS resolution failed, return null to use default server
		return null;
	}
};

/**
 * Generate an avatar URL for the given options.
 */
export const getAvatarUrl = async (options: AvatarOptions): Promise<string> => {
	const identity = parseUserIdentity(options.email, options.openid);
	const hash = identity.hash;
	const domain = identity.domain;
	const https = options.https || false;

	if (!hash) {
		throw new Error('An email or an OpenID must be provided.');
	}

	// Create a copy of options without the identity and https fields
	const queryOptions = { ...options };
	delete queryOptions.email;
	delete queryOptions.openid;
	delete queryOptions.https;

	const queryData = stringify(queryOptions);
	const query = queryData ? `?${queryData}` : '';

	const delegationServer = await getDelegationServer(domain, https);

	return composeAvatarUrl(delegationServer, hash, query, https);
};

// Default export for the main functionality
export default {
	getAvatarUrl,
	// Export utility functions for testing
	sanitizedTarget,
	srvHostname,
	parseUserIdentity,
	serviceName,
	composeAvatarUrl,
	getDelegationServer,
};
