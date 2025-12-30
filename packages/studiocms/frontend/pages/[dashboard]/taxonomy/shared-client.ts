interface tsPageDataCategoriesSelect {
	readonly meta: {
		readonly [x: string]: unknown;
	};
	readonly id: number;
	readonly parent: number | null | undefined;
	readonly description: string;
	readonly name: string;
	readonly slug: string;
}

interface tsPageDataTagsSelect {
	readonly meta: {
		readonly [x: string]: unknown;
	};
	readonly id: number;
	readonly description: string;
	readonly name: string;
	readonly slug: string;
}

type CurrentEntry<T> = T extends 'categories'
	? tsPageDataCategoriesSelect
	: T extends 'tags'
		? tsPageDataTagsSelect
		: // biome-ignore lint/complexity/noBannedTypes: false positive
			{};

export interface CurrentEntryData<T extends 'categories' | 'tags'> {
	type: T;
	mode: 'create' | 'edit' | '';
	currentEntry: CurrentEntry<T>;
	allCategories: Pick<tsPageDataCategoriesSelect, 'id' | 'name'>[];
	allTags: Pick<tsPageDataTagsSelect, 'id' | 'name'>[];
}

export function getCurrentEntryData<T extends 'categories' | 'tags'>(
	dataEl?: HTMLElement
): CurrentEntryData<T> {
	const type = dataEl?.getAttribute('data-type') as T;

	const modeAttr = dataEl?.getAttribute('data-mode');
	const mode = modeAttr === 'create' || modeAttr === 'edit' ? modeAttr : '';

	const currentEntryAttr = dataEl?.getAttribute('data-current-entry') ?? '{}';
	const currentEntry = JSON.parse(currentEntryAttr) as CurrentEntry<T>;

	const allCategoriesAttr = dataEl?.getAttribute('data-all-categories') ?? '[]';
	const allCategories = JSON.parse(allCategoriesAttr) as Pick<
		tsPageDataCategoriesSelect,
		'id' | 'name'
	>[];

	const allTagsAttr = dataEl?.getAttribute('data-all-tags') ?? '[]';
	const allTags = JSON.parse(allTagsAttr) as Pick<tsPageDataTagsSelect, 'id' | 'name'>[];

	return {
		type,
		mode,
		currentEntry,
		allCategories,
		allTags,
	};
}
