#!/usr/bin/env node
export default async function run() {
	const [cmd, ...args] = process.argv.slice(2);
	switch (cmd) {
		case 'dev':
		case 'build': {
			const { default: build } = await import('./cmd/build.js');
			await build(...args, cmd === 'dev' ? 'IS_DEV' : undefined);
			break;
		}
	}
}

run();
