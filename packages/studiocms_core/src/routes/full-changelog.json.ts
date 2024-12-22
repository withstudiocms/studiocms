import contentRenderer from 'studiocms:renderer/current';
import type { APIRoute } from 'astro';
import { HTMLString } from 'astro/runtime/server/index.js';

export const GET: APIRoute = async () => {
	const Changelog = await fetch(
		'https://raw.githubusercontent.com/withstudiocms/studiocms/refs/heads/main/packages/studiocms/CHANGELOG.md'
	);

	const ChangelogText = await Changelog.text();

	if (ChangelogText) {
		const renderedContent = await contentRenderer(ChangelogText);

		return new Response(
			JSON.stringify({ success: true, changelog: new HTMLString(renderedContent) }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					Date: new Date().toUTCString(),
				},
			}
		);
	}

	return new Response(JSON.stringify({ success: false, error: 'Error fetching changelog' }), {
		status: 500,
		headers: {
			'Content-Type': 'application/json',
			Date: new Date().toUTCString(),
		},
	});
};
