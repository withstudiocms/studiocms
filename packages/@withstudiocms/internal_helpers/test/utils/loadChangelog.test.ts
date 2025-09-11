/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { describe, expect, it } from 'vitest';
import { loadChangelog, semverCategories } from '../../src/utils/loadChangelog.js';

// Example changelog markdown for testing
const exampleMarkdown = `
# @withstudiocms/config-utils

## 0.1.0-beta.3

### Patch Changes

- [#685](https://github.com/withstudiocms/studiocms/pull/685) [\`169c9be\`](https://github.com/withstudiocms/studiocms/commit/169c9be7649bbd9522c6ab68a9aeca4ebfc2b86d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add tests to ensure functionality of main utils

## 0.1.0-beta.2

### Patch Changes

- [#666](https://github.com/withstudiocms/studiocms/pull/666) [\`0b1574b\`](https://github.com/withstudiocms/studiocms/commit/0b1574bfe32ef98dc62ed9082a132a540f0ad4ba) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak watch config utility to be a builder akin to the configresolver util

## 0.1.0-beta.1

### Patch Changes

- [#657](https://github.com/withstudiocms/studiocms/pull/657) [\`a05bb16\`](https://github.com/withstudiocms/studiocms/commit/a05bb16d3dd0d1a429558b4dce316ad7fb80b049) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate to using new config utils package that contains generic config helpers instead of relying on specific ones built-in to studiocms

`;

describe('loadChangelog', () => {
	it('parses package name and versions', () => {
		const changelog = loadChangelog({ raw: exampleMarkdown });
		expect(changelog.packageName).toBe('@withstudiocms/config-utils');
		expect(changelog.versions.length).toBe(3);
		expect(changelog.versions[0].version).toBe('0.1.0-beta.3');
		expect(changelog.versions[1].version).toBe('0.1.0-beta.2');
		expect(changelog.versions[2].version).toBe('0.1.0-beta.1');
	});

	it('parses semver categories and changes', () => {
		const changelog = loadChangelog({ raw: exampleMarkdown });
		for (const version of changelog.versions) {
			for (const cat of semverCategories) {
				expect(version.changes[cat]).toBeTruthy();
				expect(version.changes[cat].type).toBe('list');
				expect(Array.isArray(version.changes[cat].children)).toBe(true);
			}
		}
	});

	it('parses GitHub usernames to links', () => {
		const changelog = loadChangelog({ raw: exampleMarkdown });
		const patchChanges = changelog.versions[0].changes.patch.children;

		const found = patchChanges.some((item: any) =>
			item.children[0].children.some(
				(node: any) =>
					typeof node.url === 'string' &&
					node.url.includes('https://github.com/Adammatthiesen') &&
					node.children.some(
						(child: any) =>
							typeof child.value === 'string' && child.value.includes('@Adammatthiesen')
					)
			)
		);
		expect(found).toBe(true);
	});

	it('throws on unexpected structure', () => {
		const badMarkdown = '## 1.0.0\n### Major\n- Something';
		expect(() => loadChangelog({ raw: badMarkdown })).toThrow(/Unexpected h2/);
	});

	it('throws on unknown semver category', () => {
		const badMarkdown = '# pkg\n## 1.0.0\n### Unknown\n- Something';
		expect(() => loadChangelog({ raw: badMarkdown })).toThrow(/Unexpected semver category/);

		const badMarkdown2 = '# pkg\n## 1.0.0\n### major\n- Something\n### unknown\n- Something';
		expect(() => loadChangelog({ raw: badMarkdown2 })).toThrow(/Unexpected semver category/);
	});

	it('throws on unexpected node type', () => {
		const badMarkdown = '# pkg\n> Not a heading';
		expect(() => loadChangelog({ raw: badMarkdown })).toThrow(/Unexpected node/);
	});
});
