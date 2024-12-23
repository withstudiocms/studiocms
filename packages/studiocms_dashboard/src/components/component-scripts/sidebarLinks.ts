function removeTrailingSlash(url: string) {
	return url.replace(/\/$/, '');
}

function linkPath(link: HTMLAnchorElement) {
	return new URL(link.href).pathname;
}

export function sidebarLinks() {
	const sidebarLinks = document.querySelectorAll<HTMLAnchorElement>('.sidebar-link');

	for (const link of sidebarLinks) {
		link.classList.remove('active');

		const linkP = removeTrailingSlash(linkPath(link)).trim();
		const windowP = removeTrailingSlash(window.location.pathname).trim();

		if (linkP === windowP) {
			console.log(linkP, windowP);
			link.classList.add('active');
		}
	}
}
