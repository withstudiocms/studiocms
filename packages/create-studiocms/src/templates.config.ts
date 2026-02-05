import templates from './templates.json';
import type {
	CurrentRepository,
	GigetRepoUrl,
	TemplateOptions,
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
const currentRepository: CurrentRepository = 'withstudiocms/studiocms';

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
const defaultTemplate: string = 'blog-libsql';

/**
 * Load the templates snapshot from the templates.json file
 */
const loadTemplatesSnapshot = (): TemplateOptions => {
	return templates;
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
	currentTemplates: loadTemplatesSnapshot(),
};
