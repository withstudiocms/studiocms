import type { AstroIntegrationLogger } from 'astro';
export type LoggerOpts = {
    logLevel: 'info' | 'warn' | 'error' | 'debug';
    logger: AstroIntegrationLogger;
    verbose?: boolean;
};
export declare const integrationLogger: (opts: LoggerOpts, message: string) => Promise<void>;
