function removeTrailingSlash(url: string) {
	return url.replace(/\/$/, '');
}

function linkPath(link: HTMLAnchorElement) {
	return new URL(link.href).pathname;
}

export function sidebarLinks(sidebar: HTMLElement | null) {
	if (!sidebar) {
		return;
	}

	const sidebarLinks = sidebar.querySelectorAll<HTMLAnchorElement>('a');

	for (const link of sidebarLinks) {
		link.classList.remove('active');
		if (removeTrailingSlash(linkPath(link)) === removeTrailingSlash(window.location.pathname)) {
			link.classList.add('active');
		}
	}
}
