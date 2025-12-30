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

type WithParent<T extends 'categories' | 'tags'> = T extends 'categories'
	? { parent?: number }
	: { parent?: never };

export type CurrentEntryData<T extends 'categories' | 'tags'> = WithParent<T> & {
	type: T;
	mode: 'create' | 'edit' | '';
	currentEntry: CurrentEntry<T>;
};

export function getCurrentEntryData<T extends 'categories' | 'tags'>(
	dataEl?: HTMLElement
): CurrentEntryData<T> {
	const type = dataEl?.getAttribute('data-type') as T;

	const modeAttr = dataEl?.getAttribute('data-mode');
	const mode = modeAttr === 'create' || modeAttr === 'edit' ? modeAttr : '';

	const currentEntryAttr = dataEl?.getAttribute('data-current-entry') ?? '{}';
	const currentEntry = JSON.parse(currentEntryAttr) as CurrentEntry<T>;

	const parentId = dataEl?.getAttribute('data-parent-id');
	const parent = parentId ? Number.parseInt(parentId, 10) : undefined;

	return {
		type,
		mode,
		currentEntry,
		...(type === 'categories' ? { parent } : {}),
	} as CurrentEntryData<T>;
}

type ParseFormDataReturnType<T extends 'categories' | 'tags'> = T extends 'categories'
	? tsPageDataCategoriesSelect
	: T extends 'tags'
		? tsPageDataTagsSelect
		: never;

export const parseFormDataToJson = <
	T extends 'categories' | 'tags',
	R extends ParseFormDataReturnType<T> & { mode: 'create' | 'edit' },
>(
	formData: FormData
): R => {
	// Construct the entry object
	const entry: Record<string, unknown> = {};

	// Iterate over each key-value pair in the FormData
	for (const [key, value] of formData.entries()) {
		// Handle specific keys with type conversions
		// 'id' and 'parent' should be numbers
		// 'meta' should be parsed as JSON
		// Other values should be assigned directly, converting 'null' string to null
		if (key === 'id' || key === 'parent') {
			entry[key] = Number(value);
		} else if (key === 'meta') {
			// Attempt to parse JSON, default to empty object on failure
			try {
				entry[key] = JSON.parse(value as string);
			} catch {
				entry[key] = {};
			}
		} else {
			entry[key] = value === 'null' ? null : value;
		}
	}

	// Type assertion to the expected return type
	return entry as R;
};
