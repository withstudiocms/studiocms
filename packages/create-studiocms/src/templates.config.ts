import type {
	CurrentRepository,
	CurrentTemplateRegistry,
	GigetRepoUrl,
	TemplateRegistry,
} from './types.ts';

/**
 * The current repository platform for StudioCMS templates
 *
 * @remarks This is the current repository platform used to get the StudioCMS templates
 */
const repositoryPlatform: string = 'github';

/**
 * The current repository for StudioCMS templates
 *
 * @remarks This is the current repository used to get the StudioCMS templates
 */
const currentRepository: CurrentRepository = 'withstudiocms/templates';

/**
 * The current repository URL for StudioCMS templates
 *
 * @remarks This is the current repository URL used to get the StudioCMS templates
 */
const gigetRepoUrl: GigetRepoUrl = `${repositoryPlatform}:${currentRepository}`;

/**
 * The current repository URL for StudioCMS templates
 *
 * @remarks This is the current repository URL used to get the StudioCMS templates
 */
const currentRepositoryUrl: string = `https://github.com/${currentRepository}`;

/**
 * The default template for StudioCMS projects
 *
 * @remarks This is the default template used when no template is selected
 */
const defaultTemplate: string = 'studiocms/blog';

/**
 * The current template registry for StudioCMS projects
 *
 * Use this object to define the current templates available for StudioCMS projects
 *
 * @remarks said templates are directories in the `withstudiocms/templates` repo
 */
const currentTemplateRegistry: CurrentTemplateRegistry = {
	studiocms: {
		label: 'StudioCMS',
		templates: {
			'blog/libsql': {
				label: 'StudioCMS w/ blog frontend (LibSQL)',
			},
			'blog/postgres': {
				label: 'StudioCMS w/ blog frontend (PostgreSQL)',
			},
			'blog/mysql': {
				label: 'StudioCMS w/ blog frontend (MySQL)',
			},
			'headless/libsql': {
				label: 'StudioCMS Headless (LibSQL)',
				hint: 'Bring your own frontend',
			},
			'headless/postgres': {
				label: 'StudioCMS Headless (PostgreSQL)',
				hint: 'Bring your own frontend',
			},
			'headless/mysql': {
				label: 'StudioCMS Headless (MySQL)',
				hint: 'Bring your own frontend',
			},
		},
	},
	// 'studiocms-ui': {
	// 	label: 'StudioCMS UI (@studiocms/ui)',
	// 	templates: {
	// 		basics: {
	// 			label: 'A basic, StudioCMS UI Project',
	// 			hint: 'recommended',
	// 		},
	// 		tailwind: {
	// 			label: 'StudioCMS UI project with Tailwind CSS',
	// 		},
	// 	},
	// },
};

/**
 * This object is used to generate the template registry for StudioCMS templates
 * from the current template repository based on the currentTemplateRegistry object above
 *
 * @remarks This object is used by the `template` interactive command to get the current templates
 */
export const templateRegistry: TemplateRegistry = {
	defaultTemplate,
	gigetRepoUrl,
	currentRepositoryUrl,
	filterRules: {
		isStudioCMSProject: 'studiocms/',
		isWithStudioCMSRepo: Object.keys(currentTemplateRegistry).map((key) => {
			return `${key}/`;
		}),
	},
	currentProjects: Object.keys(currentTemplateRegistry).map((key) => {
		return {
			value: key,
			label: currentTemplateRegistry[key].label,
		};
	}),
	currentTemplates: Object.keys(currentTemplateRegistry).reduce(
		(acc, key) => {
			acc[key] = Object.keys(currentTemplateRegistry[key].templates).map((template) => {
				return {
					value: `${key}/${template}`,
					label: currentTemplateRegistry[key].templates[template].label,
					hint: currentTemplateRegistry[key].templates[template].hint,
				};
			});
			return acc;
		},
		{} as TemplateRegistry['currentTemplates']
	),
};
