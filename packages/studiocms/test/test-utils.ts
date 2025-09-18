export function cleanAstroAttributes(str: string, mockPath: string) {
	const regex1 = /\s*data-astro-[a-zA-Z0-9-]*(?:="[^"]*")?/g;
	const regex2 = /src="[^"?]*(\?[^"]*)"/g;
	return str.replace(regex1, '').replace(regex2, (_match, p1) => {
		return `src="${mockPath}${p1}"`;
	});
}
