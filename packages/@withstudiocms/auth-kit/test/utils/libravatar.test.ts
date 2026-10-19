import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import libravatar, { type TargetComponents } from '../../src/utils/libravatar.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Libravatar Utility Tests';

// Helper for predictable hash (MD5 of 'user@example.com')
const knownEmail = 'user@example.com';
const knownEmailHash = 'b58996c504c5638798eb6b511e6f49af';

describe(parentSuiteName, () => {
	// parseUserIdentity Tests
	[
		{
			input: { email: knownEmail },
			expected: { hash: knownEmailHash, domain: 'example.com' },
		},
		{
			input: { email: undefined, openid: 'https://user:pass@openid.example.com/path' },
			expected: { hash: expect.any(String), domain: 'openid.example.com' },
		},
		{
			input: { email: undefined, openid: 'not a url' },
			expected: { hash: null, domain: null },
		},
	].forEach(({ input, expected }) => {
		test(`Libravatar Utils - parseUserIdentity with input ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parseUserIdentity Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', JSON.stringify(input));
			await allure.parameter('expected', JSON.stringify(expected));

			await allure.step(
				`Should return hash: ${expected.hash} and domain: ${expected.domain}`,
				async () => {
					const { hash, domain } = libravatar.parseUserIdentity(input.email, input.openid);
					expect(hash).toEqual(expected.hash);
					expect(domain).toBe(expected.domain);
				}
			);
		});
	});

	// srcHostname Tests
	[
		{
			input: [
				{ priority: 10, weight: 5, port: 80, name: 'a.example.com' },
				{ priority: 10, weight: 10, port: 80, name: 'b.example.com' },
			],
			expectedHosts: ['a.example.com', 'b.example.com'],
			expectedPort: 80,
		},
		{
			input: [],
			expectedHosts: [null],
			expectedPort: null,
		},
	].forEach(({ input, expectedHosts, expectedPort }) => {
		test(`Libravatar Utils - srvHostname with ${input.length} records`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('srvHostname Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input records', JSON.stringify(input));
			await allure.parameter('expected hosts', JSON.stringify(expectedHosts));
			await allure.parameter('expected port', String(expectedPort));

			await allure.step(
				`Should return one of hosts: ${expectedHosts.join(', ')} and port: ${expectedPort}`,
				async () => {
					const [target, port] = libravatar.srvHostname(input);
					expect(expectedHosts).toContain(target);
					expect(port).toBe(expectedPort);
				}
			);
		});
	});

	// sanitizedTarget Tests
	(
		[
			{
				targetComponents: [null, null],
				https: false,
				expected: null,
			},
			{
				targetComponents: ['bad!host', 80],
				https: false,
				expected: null,
			},
			{
				targetComponents: ['host', 70000],
				https: false,
				expected: null,
			},
			{
				targetComponents: ['host', 8080],
				https: false,
				expected: 'host:8080',
			},
			{
				targetComponents: ['host', 443],
				https: false,
				expected: 'host:443',
			},
			{
				targetComponents: ['host', 80],
				https: false,
				expected: 'host',
			},
			{
				targetComponents: ['host', 443],
				https: true,
				expected: 'host',
			},
			{
				targetComponents: ['host', 444],
				https: true,
				expected: 'host:444',
			},
		] as Array<{ targetComponents: TargetComponents; https: boolean; expected: string | null }>
	).forEach(({ targetComponents, https, expected }) => {
		test('Libravatar Utils - sanitizedTarget', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('sanitizedTarget Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input targetComponents', JSON.stringify(targetComponents));
			await allure.parameter('input https', String(https));
			await allure.parameter('expected', expected ?? 'null');

			await allure.step('Should return correct sanitized target', async () => {
				const result = libravatar.sanitizedTarget(targetComponents, https);
				expect(result).toBe(expected);
			});
		});
	});

	// serviceName Tests
	[
		{
			domain: 'example.com',
			https: false,
			expected: '_avatars._tcp.example.com',
		},
		{
			domain: 'example.com',
			https: true,
			expected: '_avatars-sec._tcp.example.com',
		},
		{
			domain: null,
			https: true,
			expected: null,
		},
	].forEach(({ domain, https, expected }) => {
		test(`Libravatar Utils - serviceName for domain "${domain}" with https=${https}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('serviceName Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input domain', domain ?? 'null');
			await allure.parameter('input https', String(https));
			await allure.parameter('expected', expected ?? 'null');

			await allure.step('Should return correct service name', async () => {
				const result = libravatar.serviceName(domain, https);
				expect(result).toBe(expected);
			});
		});
	});

	// composeAvatarUrl tests
	[
		{
			delegationServer: null,
			avatarHash: knownEmailHash,
			queryString: '?s=128',
			https: true,
			expected: `https://seccdn.libravatar.org/avatar/${knownEmailHash}?s=128`,
		},
		{
			delegationServer: 'custom.example.com:8080',
			avatarHash: knownEmailHash,
			queryString: '',
			https: false,
			expected: `http://custom.example.com:8080/avatar/${knownEmailHash}`,
		},
	].forEach(({ delegationServer, avatarHash, queryString, https, expected }) => {
		test(`Libravatar Utils - composeAvatarUrl with delegationServer="${delegationServer}" and https=${https}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('composeAvatarUrl Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input delegationServer', delegationServer ?? 'null');
			await allure.parameter('input avatarHash', avatarHash);
			await allure.parameter('input queryString', queryString);
			await allure.parameter('input https', String(https));
			await allure.parameter('expected', expected);

			await allure.step('Should return correct composed URL', async () => {
				const result = libravatar.composeAvatarUrl(
					delegationServer,
					avatarHash,
					queryString,
					https
				);
				expect(result).toBe(expected);
			});
		});
	});

	test('Libravatar Utils - getAvatarUrl throws if no email or openid', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getAvatarUrl Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should throw an error', async () => {
			await expect(libravatar.getAvatarUrl({})).rejects.toThrow(/must be provided/);
		});
	});

	[
		{
			email: knownEmail,
			https: true,
			s: 128,
			match: 'https://seccdn.libravatar.org/avatar/',
		},
		{
			openid: 'https://openid.example.com/user',
			https: false,
			d: 'retro',
			match: 'http://cdn.libravatar.org/avatar/',
		},
	].forEach(({ email, openid, https, s, d, match }) => {
		const idType = email ? 'email' : 'openid';
		const idValue = email ?? openid;
		test(`Libravatar Utils - getAvatarUrl returns valid URL for ${idType} "${idValue}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getAvatarUrl Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input ' + idType, idValue);
			await allure.parameter('input https', String(https));
			if (s !== undefined) {
				await allure.parameter('input s', String(s));
			}
			if (d !== undefined) {
				await allure.parameter('input d', d);
			}
			await allure.parameter('expected match', match.toString());

			await allure.step('Should return a valid URL', async () => {
				const url = await libravatar.getAvatarUrl({ email, openid, https, s, d });
				expect(url).toContain(match);
			});
		});
	});
});
