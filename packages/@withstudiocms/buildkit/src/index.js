#!/usr/bin/env node
import builder from "./cmds/builder.js";
import showHelp from "./cmds/help.js";
import test from "./cmds/test.js";

/**
 * Main function to handle command line arguments and execute the appropriate command.
 */
export default async function main() {
    const [cmd, ...args] = process.argv.slice(2);
    switch (cmd) {
        case 'dev':
        case 'build':
            await builder(cmd, args);
            break;
        case 'test':
            await test(args);
            break;
        default: {
            showHelp();
            break;
        }
    }
}

// THIS IS THE ENTRY POINT FOR THE CLI - DO NOT REMOVE
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
