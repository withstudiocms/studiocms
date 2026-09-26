import * as allure from 'allure-js-commons';
import { beforeAll, describe, expect, test } from 'vitest';
import { createMarkdownProcessor, markdownConfigDefaults } from '../../../src/core/index.js';
import type { MarkdownProcessor } from '../../../src/types.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'remark Collect Images Plugin Tests';

describe(parentSuiteName, () => {
	let processor: MarkdownProcessor;

	beforeAll(async () => {
		processor = await createMarkdownProcessor({
			...markdownConfigDefaults,
			image: { domains: ['example.com'] },
		});
	});

	[
		{
			name: 'should collect inline image paths',
			markdown: 'Hello ![inline image url](./img.png)',
			fileURL: 'file.md',
			validate: (code: string, localImagePaths: string[], remoteImagePaths: string[]) => {
				expect(code).toBe(
					'<p>Hello <img __ASTRO_IMAGE_="{&#x22;src&#x22;:&#x22;./img.png&#x22;,&#x22;alt&#x22;:&#x22;inline image url&#x22;,&#x22;index&#x22;:0}"></p>'
				);

				expect(localImagePaths).toEqual(['./img.png']);
				expect(remoteImagePaths).toEqual([]);
			},
		},
		{
			name: 'should collect allowed remote image paths',
			markdown: 'Hello ![inline remote image url](https://example.com/example.png)',
			fileURL: 'file.md',
			validate: (code: string, localImagePaths: string[], remoteImagePaths: string[]) => {
				expect(code).toBe(
					`<p>Hello <img __ASTRO_IMAGE_="{&#x22;inferSize&#x22;:true,&#x22;src&#x22;:&#x22;https://example.com/example.png&#x22;,&#x22;alt&#x22;:&#x22;inline remote image url&#x22;,&#x22;index&#x22;:0}"></p>`
				);

				expect(localImagePaths).toEqual([]);
				expect(remoteImagePaths).toEqual(['https://example.com/example.png']);
			},
		},
		{
			name: 'should not collect other remote image paths',
			markdown: 'Hello ![inline remote image url](https://google.com/google.png)',
			fileURL: 'file.md',
			validate: (code: string, localImagePaths: string[], remoteImagePaths: string[]) => {
				expect(code).toBe(
					`<p>Hello <img src="https://google.com/google.png" alt="inline remote image url"></p>`
				);

				expect(localImagePaths).toEqual([]);
				expect(remoteImagePaths).toEqual([]);
			},
		},
		{
			name: 'should add image paths from definition',
			markdown:
				'Hello ![image ref][img-ref] ![remote image ref][remote-img-ref]\n\n[img-ref]: ./img.webp\n[remote-img-ref]: https://example.com/example.jpg',
			fileURL: 'file.md',
			validate: (code: string, localImagePaths: string[], remoteImagePaths: string[]) => {
				expect(code).toBe(
					'<p>Hello <img __ASTRO_IMAGE_="{&#x22;src&#x22;:&#x22;./img.webp&#x22;,&#x22;alt&#x22;:&#x22;image ref&#x22;,&#x22;index&#x22;:0}"> <img __ASTRO_IMAGE_="{&#x22;inferSize&#x22;:true,&#x22;src&#x22;:&#x22;https://example.com/example.jpg&#x22;,&#x22;alt&#x22;:&#x22;remote image ref&#x22;,&#x22;index&#x22;:0}"></p>'
				);

				expect(localImagePaths).toEqual(['./img.webp']);
				expect(remoteImagePaths).toEqual(['https://example.com/example.jpg']);
			},
		},
	].forEach(({ name, markdown, fileURL, validate }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Image Collection Tests');
			await allure.tags(...sharedTags);

			const {
				code,
				metadata: { localImagePaths, remoteImagePaths },
				// @ts-expect-error - fileURL is for internal testing and usage
			} = await processor.render(markdown, { fileURL });

			validate(code, localImagePaths, remoteImagePaths);
		});
	});
});
