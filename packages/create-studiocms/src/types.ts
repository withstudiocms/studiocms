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

export type TemplateOption = {
	value: string;
	label?: string | undefined;
	hint?: string | undefined;
	disabled?: boolean | undefined;
};

export type TemplateOptions = TemplateOption[];

/**
 * Template Registry Interface
 */
export interface TemplateRegistry {
	defaultTemplate: string;
	gigetRepoUrl: GigetRepoUrl;
	currentRepositoryUrl: string;
	currentTemplates: TemplateOptions;
}
