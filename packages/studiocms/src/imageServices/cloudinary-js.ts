import { createResolver } from 'astro-integration-kit';
import { definePlugin } from '../schemas/index.js';
import { readJson } from '../utils/readJson.js';

const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { version: studiocmsMinimumVersion } = readJson<{ name: string; version: string }>(
	resolve('../../package.json')
);

const identifier = 'cloudinary-js';
const servicePath = resolve('../imageServices-internal/cloudinary-js-service.js');

function cloudinaryImageService() {
	return definePlugin({
		name: `Cloudinary JS Image Service (${identifier})`,
		identifier,
		studiocmsMinimumVersion,
		hooks: {
			'studiocms:config:setup': ({ setImageService }) => {
				setImageService({
					imageService: {
						identifier,
						servicePath,
					},
				});
			},
		},
	});
}

export default cloudinaryImageService;
