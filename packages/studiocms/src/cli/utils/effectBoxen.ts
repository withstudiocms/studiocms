import { AstroError } from 'astro/errors';
import _boxen from 'boxen';
import { Effect } from '../../effect.js';

/**
Creates a box in the terminal.

@param text - The text inside the box.
@returns The box.

@example
```
const message1 = yield* effectBoxen(
  (boxen) => boxen('unicorn', {padding: 1})
);

console.log(message1);
// ┌─────────────┐
// │             │
// │   unicorn   │
// │             │
// └─────────────┘

const message2 = yield* effectBoxen(
  (boxen) => boxen('unicorn', { 
    padding: 1, 
    margin: 1, 
    borderStyle: 'double' 
  })
);

console.log(message2);
//
// ╔═════════════╗
// ║             ║
// ║   unicorn   ║
// ║             ║
// ╚═════════════╝
//
```
*/
export const effectBoxen = Effect.fn(<T>(fn: (boxen: typeof _boxen) => T) =>
	Effect.try({
		try: () => fn(_boxen),
		catch: (cause) =>
			new AstroError('Boxen Error', `Failed to run boxen: ${(cause as Error).message}`),
	})
);
