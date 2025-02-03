function stripHTTPandHTTPS(url: string) {
	return url.replace('http://', '').replace('https://', '');
}

function stripTrailingSlash(url: string) {
	return url.replace(/\/$/, '');
}

function setHTTP(url: string) {
	return `http://${url}`;
}

function setHTTPS(url: string) {
	return `https://${url}`;
}

function splitListandSelectFirst(list: string) {
	if (list.indexOf(',') === -1) return list;
	return list.split(',')[0];
}

/**
 * Get the Domain of the Coolify URL from the coolify runtime environment
 *
 * Requires the COOLIFY_FQDN environment variable to be set as per the coolify docs:
 *
 * @see https://coolify.io/docs/knowledge-base/environment-variables#predefined-variables
 */
export const getCoolifyURL = (returnHttps?: boolean) => {
	const urlList = process.env.COOLIFY_DOMAIN_FQDN;
	if (!urlList) {
		return undefined;
	}
	const url = splitListandSelectFirst(urlList);
	if (returnHttps) {
		return setHTTPS(url);
	}
	return setHTTP(url);
};

export default getCoolifyURL;
