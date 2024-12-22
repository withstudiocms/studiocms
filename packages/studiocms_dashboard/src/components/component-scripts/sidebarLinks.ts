function removeTrailingSlash(url: string) {
	return url.replace(/\/$/, '');
}

export function sidebarLinks() {
	const sidebar = document.querySelector<HTMLElement>('.sidebar');
	if (!sidebar) {
		return;
	}
	const sidebarLinks = sidebar.querySelectorAll<HTMLAnchorElement>('a');

	for (const link of sidebarLinks) {
		link.classList.remove('active');
		if (
			removeTrailingSlash(window.location.pathname) ===
			removeTrailingSlash(new URL(link.href).pathname)
		) {
			link.classList.add('active');
		}
	}
}
