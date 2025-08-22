/** biome-ignore-all lint/correctness/noUnusedVariables: This is being used as a global augmentation */
interface Window {
	theme: {
		setTheme: (theme: 'system' | 'dark' | 'light') => void;
		getTheme: () => 'system' | 'dark' | 'light';
		getSystemTheme: () => 'light' | 'dark';
		getDefaultTheme: () => 'system' | 'dark' | 'light';
	};
}
