import type { Context } from '../context.ts';

/**
 * Determine if the template is a StudioCMS template or third-party
 */
export function templateTargetFilter(
	template: string,
	templateRegistry: Context['templateRegistry'],
	explicitStudioCMS = false
) {
	if (explicitStudioCMS) {
		return template.startsWith(templateRegistry.filterRules.isStudioCMSProject);
	}

	return templateRegistry.filterRules.isWithStudioCMSRepo.some((rule) => template.startsWith(rule));
}

/**
 * Get the full template target URL for giget
 */
export function getTemplateTarget(
	_template: string,
	templateRegistry: Context['templateRegistry'],
	ref = 'main'
) {
	if (!templateTargetFilter(_template, templateRegistry)) {
		// Handle third-party templates
		const isThirdParty = _template.includes('/');
		if (isThirdParty) return _template;
	}

	// Handle StudioCMS templates
	if (ref === 'main') {
		// `latest` ref is specially handled to route to a branch specifically
		// to allow faster downloads. Otherwise giget has to download the entire
		// repo and only copy a sub directory
		return `${templateRegistry.gigetRepoUrl}/${_template}`;
	}
	return `${templateRegistry.gigetRepoUrl}/${_template}#${ref}`;
}
