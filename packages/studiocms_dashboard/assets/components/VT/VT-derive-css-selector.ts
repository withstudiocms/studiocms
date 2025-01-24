export function deriveCSSSelector(element?: Element, useIds = true) {
	const path: string[] = [];
	while (element && element.nodeType === Node.ELEMENT_NODE) {
		let selector = element.nodeName.toLowerCase();
		if (useIds && element.id) {
			selector = `#${element.id}`;
			path.unshift(selector);
			break;
		}
		let sibling = element;
		let nth = 1;
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		while ((sibling = sibling.previousElementSibling as Element)) {
			if (sibling.nodeName.toLowerCase() === selector) nth++;
		}
		if (nth !== 1) {
			selector += `:nth-of-type(${nth})`;
		}
		path.unshift(selector);
		element = element.parentNode as Element;
	}
	return path.join(' > ');
}
