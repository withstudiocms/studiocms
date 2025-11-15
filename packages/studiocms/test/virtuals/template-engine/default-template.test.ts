import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import defaultTemplates from '../../../src/virtuals/template-engine/default-templates.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Default Template Engine tests';

describe(parentSuiteName, () => {
	[
		{ prop: 'notifications' },
		{ prop: 'passwordReset' },
		{ prop: 'userInvite' },
		{ prop: 'verifyEmail' },
	].forEach(({ prop }) => {
		const testName = `${localSuiteName} - ${prop} template`;
		const tags = [...sharedTags, 'template-engine:virtuals', `template:${prop}`];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.parameter('template', prop);

			await allure.step(`Checking ${prop} template existence`, async () => {
				expect(defaultTemplates).toHaveProperty(prop);
			});
		});
	});

	[
		{
			template: defaultTemplates.notifications,
			toContain: ['{{data.title}}', '{{data.message}}', '<!doctype html>'],
		},
		{
			template: defaultTemplates.passwordReset,
			toContain: ['{{data.link}}', 'Reset Your Password', '<!doctype html>'],
		},
		{
			template: defaultTemplates.userInvite,
			toContain: ['{{site.title}}', '{{data.link}}', 'New User Invite from', '<!doctype html>'],
		},
		{
			template: defaultTemplates.verifyEmail,
			toContain: ['{{data.link}}', 'Verify your Email', '<!doctype html>'],
		},
	].forEach(({ template, toContain }) => {
		const testName = `${localSuiteName} - template content validation`;
		const tags = [...sharedTags, 'template-engine:virtuals', 'template:content-validation'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.step('Validating template content', async () => {
				toContain.forEach((str) => {
					expect(template).toContain(str);
				});
			});
		});
	});
});
