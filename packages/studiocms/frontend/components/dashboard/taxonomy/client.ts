const TaxonomyLocalStorageValueMap = {
	0: 'categories',
	1: 'tags',
} as const;

export function getTaxonomyLocalStorageValue(): 'categories' | 'tags' {
	const key = 'sui-tabs-taxonomy-selection';
	const storedValue = localStorage.getItem(key);
	if (storedValue) {
		const parsedValue = Number.parseInt(storedValue, 10);
		if (parsedValue in TaxonomyLocalStorageValueMap) {
			return TaxonomyLocalStorageValueMap[parsedValue as keyof typeof TaxonomyLocalStorageValueMap];
		}
	}

	// Default to categories if no valid stored value
	return 'categories';
}
