import type { MiddlewareHandler } from 'astro';
import { defineMiddleware as _defineMiddleware } from 'astro/middleware';
import { runEffect } from '../index.js';
import type { EffectMiddlewareHandler, EffectMiddlewareRouterEntry } from './types.js';
import { buildMiddlewareSequence } from './utils/middleware.js';

/**
 * Defines an effect middleware by wrapping the provided handler function.
 * The middleware handler is executed within the `runEffect` context, allowing
 * for effectful operations to be managed and composed.
 *
 * @param fn - The effect middleware handler function to be wrapped.
 * @returns A middleware handler that executes the effect middleware within `runEffect`.
 */
export const defineMiddleware = (fn: EffectMiddlewareHandler): MiddlewareHandler =>
	_defineMiddleware(async (context, next) => await runEffect(fn(context, next)));

/**
 * Defines a middleware router that filters and applies middleware handlers based on path matching.
 *
 * The router is an array of route definitions, each specifying `includePaths` and `excludePaths`
 * for matching against the current request's pathname. Handlers whose paths match the criteria
 * are executed in sequence.
 *
 * @param router - An array of middleware route definitions, each containing path matching options and a handler.
 * @returns A composed middleware handler that executes all matching handlers in order, or calls `next` if none match.
 */
export const defineMiddlewareRouter = (router: EffectMiddlewareRouterEntry[]): MiddlewareHandler =>
	_defineMiddleware((context, next) => buildMiddlewareSequence(context, next, router));
