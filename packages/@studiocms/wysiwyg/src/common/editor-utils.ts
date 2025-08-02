import type { AddComponentTypeOptions, BlockProperties, Editor } from 'grapesjs';

export function componentBuilder(comp: Editor['Components'], bm: Editor['BlockManager']) {
	return (id: string, methods: AddComponentTypeOptions, props: BlockProperties) => {
		comp.addType(`astro-component-${id}`, methods);
		bm.add(`astro-component-${id}`, props);
	};
}
