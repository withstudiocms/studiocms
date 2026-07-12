// @ts-nocheck
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { virtualImportsPlugin } from '../src/vite/virtualImportsPlugin.js';
import {
    parentSuiteName,
    sharedTags,
} from './test-utils.js';

const localSuiteName = 'virtualImportsPlugin';

describe(parentSuiteName, () => {
    test(localSuiteName + ' - should resolve and load unscoped virtual imports', async () => {
        await allure.parentSuite(parentSuiteName);
        await allure.suite(localSuiteName);
        await allure.subSuite(`${localSuiteName} - should resolve and load unscoped virtual imports`);
        await allure.tags(...sharedTags);

		const plugin = virtualImportsPlugin('test-plugin', {
			'test:virtual': 'export const value = 1;',
		}) as Exclude<ReturnType<typeof virtualImportsPlugin>, undefined>;

        await allure.step('resolveId should return the correct resolved id', async (ctx) => {
            const resolved = plugin.resolveId?.('test:virtual');
            expect(resolved).toBe('\0test:virtual');

            await ctx.parameter('resolved', resolved);
        });

        await allure.step('load should return the correct content', async (ctx) => {
            const content = plugin.load?.('\0test:virtual');
            expect(content).toBe('export const value = 1;');

            await ctx.parameter('content', content);
        });
    });

    test(localSuiteName + ' - should not resolve or load virtual imports with mismatched context', async () => {
        await allure.parentSuite(parentSuiteName);
        await allure.suite(localSuiteName);
        await allure.subSuite(`${localSuiteName} - should not resolve or load virtual imports with mismatched context`);
        await allure.tags(...sharedTags);

        const plugin = virtualImportsPlugin('test-plugin', [
            { id: 'test:server', content: 'export const target = "server";', context: 'server' },
            { id: 'test:client', content: 'export const target = "client";', context: 'client' },
        ]) as Exclude<ReturnType<typeof virtualImportsPlugin>, undefined>;

        await allure.step('resolveId should return undefined for mismatched context', async (ctx) => {
            const resolvedServer = plugin.resolveId?.('test:server', undefined, { ssr: false });
            const resolvedClient = plugin.resolveId?.('test:client', undefined, { ssr: true });

            expect(resolvedServer).toBeUndefined();
            expect(resolvedClient).toBeUndefined();

            await ctx.parameter('resolvedServer', resolvedServer);
            await ctx.parameter('resolvedClient', resolvedClient);
        });

        await allure.step('load should return undefined for mismatched context', async (ctx) => {
            const contentServer = plugin.load?.('\0test:server', { ssr: false });
            const contentClient = plugin.load?.('\0test:client', { ssr: true });

            expect(contentServer).toBeUndefined();
            expect(contentClient).toBeUndefined();

            await ctx.parameter('contentServer', contentServer);
            await ctx.parameter('contentClient', contentClient);
        });
    });

    test(localSuiteName + ' - should resolve and load virtual imports with matching context', async () => {
        await allure.parentSuite(parentSuiteName);
        await allure.suite(localSuiteName);
        await allure.subSuite(`${localSuiteName} - should resolve and load virtual imports with matching context`);
        await allure.tags(...sharedTags);

        const plugin = virtualImportsPlugin('test-plugin', [
            { id: 'test:server', content: 'export const target = "server";', context: 'server' },
            { id: 'test:client', content: 'export const target = "client";', context: 'client' },
        ]) as Exclude<ReturnType<typeof virtualImportsPlugin>, undefined>;

        await allure.step('resolveId should return the correct resolved id for matching context', async (ctx) => {
            const resolvedServer = plugin.resolveId?.('test:server', undefined, { ssr: true });
            const resolvedClient = plugin.resolveId?.('test:client', undefined, { ssr: false });

            expect(resolvedServer).toBe('\0test:server');
            expect(resolvedClient).toBe('\0test:client');

            await ctx.parameter('resolvedServer', resolvedServer);
            await ctx.parameter('resolvedClient', resolvedClient);
        });

        await allure.step('load should return the correct content for matching context', async (ctx) => {
            const contentServer = plugin.load?.('\0test:server', { ssr: true });
            const contentClient = plugin.load?.('\0test:client', { ssr: false });

            expect(contentServer).toBe('export const target = "server";');
            expect(contentClient).toBe('export const target = "client";');

            await ctx.parameter('contentServer', contentServer);
            await ctx.parameter('contentClient', contentClient);
        });
    });
});
