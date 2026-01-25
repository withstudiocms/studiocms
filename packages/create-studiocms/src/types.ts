/**
 * Current Template Registry Interface
 */
export interface CurrentTemplateRegistry {
	[key: string]: {
		label: string;
		templates: Record<string, { label: string; hint?: string }>;
	};
}

/**
 * Current Repository Type
 */
export type CurrentRepository = `${string}/${string}`;

/**
 * Giget Repository URL Type
 */
export type GigetRepoUrl = `${string}:${string}/${string}`;

/**
 * Filter Rules Interface
 */
export interface FilterRules {
	isStudioCMSProject: string;
	isWithStudioCMSRepo: string[];
}

/**
 * Template Registry Interface
 */
export interface TemplateRegistry {
	defaultTemplate: string;
	gigetRepoUrl: GigetRepoUrl;
	currentRepositoryUrl: string;
	filterRules: FilterRules;
	currentProjects: Array<{ value: string; label: string; hint?: string }>;
	currentTemplates: {
		[key: string]: Array<{ value: string; label: string; hint?: string }>;
	};
}
