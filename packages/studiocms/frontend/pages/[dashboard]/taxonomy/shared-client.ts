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
	const typeAttr = dataEl?.getAttribute('data-type');
	if (typeAttr !== 'categories' && typeAttr !== 'tags') {
		throw new Error(`Invalid taxonomy type: ${typeAttr}`);
	}
	const type = typeAttr as T;

	const modeAttr = dataEl?.getAttribute('data-mode');
	const mode = modeAttr === 'create' || modeAttr === 'edit' ? modeAttr : '';

	const currentEntryAttr = dataEl?.getAttribute('data-current-entry') ?? '{}';
	let currentEntry: CurrentEntry<T>;
	try {
		currentEntry = JSON.parse(currentEntryAttr) as CurrentEntry<T>;
	} catch {
		currentEntry = {} as CurrentEntry<T>;
	}

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
	R extends ParseFormDataReturnType<T> & { mode: 'create' | 'edit'; type: T },
>(
	formData: FormData,
	type: T
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
			const num = Number(value);
			if (value !== 'null' && !Number.isNaN(num)) {
				entry[key] = num;
			} else if (value === 'null') {
				entry[key] = null;
			} else {
				throw new Error(`Invalid numeric value for ${key}: ${value}`);
			}
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

	// Add the type to the entry
	entry.type = type;

	// Type assertion to the expected return type
	return entry as R;
};
