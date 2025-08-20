import assert from 'node:assert';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { Effect } from '@withstudiocms/effect';
import { ComponentNotFoundError } from '../dist/errors.js';
import { ComponentRegistry } from '../dist/registry/index.js'; // Adjust path as needed

describe('ComponentRegistry', () => {
	const testDir = './test-components';

	/** @type {ComponentRegistry} */
	let registry;

	beforeEach(async () => {
		// Create test directory
		mkdirSync(testDir, { recursive: true });

		// Create registry instance
		registry = await Effect.runPromise(
			Effect.gen(function* () {
				const registry = yield* ComponentRegistry;

				return registry;
			}).pipe(Effect.provide(ComponentRegistry.Default))
		);
	});

	afterEach(() => {
		// Clean up test directory
		rmSync(testDir, { recursive: true, force: true });
	});

	describe('registerComponentFromFile', () => {
		it('should register a component from a basic Astro file', async () => {
			const astroContent = `---
interface Props {
	title: string;
	count?: number;
	isVisible: boolean;
}

const { title, count = 0, isVisible } = Astro.props;
---

<div>
	<h1>{title}</h1>
	{isVisible && <p>Count: {count}</p>}
</div>`;

			const filePath = join(testDir, 'BasicComponent.astro');
			writeFileSync(filePath, astroContent);

			await Effect.runPromise(registry.registerComponentFromFile(filePath));

			// Should complete without error
			assert.ok(true);

			// Verify component was registered
			const component = await Effect.runPromise(registry.getComponentProps('BasicComponent'));

			assert.ok(component);
			assert.ok(component.props);
			assert.strictEqual(component.props.length, 3);

			// Check individual props
			const titleProp = component.props.find((p) => p.name === 'title');
			const countProp = component.props.find((p) => p.name === 'count');
			const isVisibleProp = component.props.find((p) => p.name === 'isVisible');

			assert.ok(titleProp);
			assert.strictEqual(titleProp.optional, false);
			assert.strictEqual(titleProp.type, 'string');

			assert.ok(countProp);
			assert.strictEqual(countProp.optional, true);
			assert.strictEqual(countProp.type, 'number');

			assert.ok(isVisibleProp);
			assert.strictEqual(isVisibleProp.optional, false);
			assert.strictEqual(isVisibleProp.type, 'boolean');
		});

		it('should register component with custom name', async () => {
			const astroContent = `---
interface Props {
	message: string;
}

const { message } = Astro.props;
---

<p>{message}</p>`;

			const filePath = join(testDir, 'SomeFile.astro');
			writeFileSync(filePath, astroContent);

			await Effect.runPromise(registry.registerComponentFromFile(filePath, 'CustomName'));

			const component = await Effect.runPromise(registry.getComponentProps('CustomName'));

			assert.ok(component);
			assert.strictEqual(component.props.length, 1);
			assert.strictEqual(component.props[0].name, 'message');
		});

		it('should handle component with no props', async () => {
			const astroContent = `---
// No props interface
---

<div>Static content</div>`;

			const filePath = join(testDir, 'StaticComponent.astro');
			writeFileSync(filePath, astroContent);

			const res = await Effect.runPromise(
				registry.registerComponentFromFile(filePath).pipe(
					Effect.catchAll((error) => {
						return Effect.succeed(new Error(`Failed to register component: ${error.message}`));
					})
				)
			);

			assert.ok(res instanceof Error);
		});

		it('should handle complex prop types', async () => {
			const astroContent = `---
interface User {
	id: number;
	name: string;
}

interface Props {
	users: User[];
	callback?: (user: User) => void;
	metadata: Record<string, any>;
	status: 'pending' | 'active' | 'inactive';
}

const { users, callback, metadata, status } = Astro.props;
---

<div>
	{users.map(user => <p key={user.id}>{user.name}</p>)}
	<span>Status: {status}</span>
</div>`;

			const filePath = join(testDir, 'ComplexComponent.astro');
			writeFileSync(filePath, astroContent);

			await Effect.runPromise(registry.registerComponentFromFile(filePath));

			const component = await Effect.runPromise(registry.getComponentProps('ComplexComponent'));

			assert.ok(component);
			assert.strictEqual(component.props.length, 4);

			const usersProp = component.props.find((p) => p.name === 'users');
			const callbackProp = component.props.find((p) => p.name === 'callback');
			const metadataProp = component.props.find((p) => p.name === 'metadata');
			const statusProp = component.props.find((p) => p.name === 'status');

			assert.ok(usersProp);
			assert.strictEqual(usersProp.optional, false);

			assert.ok(callbackProp);
			assert.strictEqual(callbackProp.optional, true);

			assert.ok(metadataProp);
			assert.ok(statusProp);
		});

		it('should throw error for non-existent file', async () => {
			const filePath = join(testDir, 'DoesNotExist.astro');

			await assert.rejects(
				Effect.runPromise(registry.registerComponentFromFile(filePath)),
				(error) => {
					// Could be FileParseError or filesystem error
					assert.ok(error.message);
					return true;
				}
			);
		});
	});

	describe('getComponentProps', () => {
		it('should return component props for registered component', async () => {
			const astroContent = `---
interface Props {
	name: string;
	age: number;
}

const { name, age } = Astro.props;
---

<div>{name} is {age} years old</div>`;

			const filePath = join(testDir, 'PersonComponent.astro');
			writeFileSync(filePath, astroContent);

			await Effect.runPromise(registry.registerComponentFromFile(filePath));

			const component = await Effect.runPromise(registry.getComponentProps('PersonComponent'));

			assert.ok(component);
			assert.strictEqual(component.props.length, 2);
		});

		it('should throw ComponentNotFoundError for unregistered component', async () => {
			await Effect.runPromise(
				registry.getComponentProps('NonExistent').pipe(
					Effect.catchAll((error) => {
						assert.ok(error instanceof ComponentNotFoundError);
						return Effect.succeed(undefined);
					})
				)
			);
		});
	});

	describe('getAllComponents', () => {
		it('should return empty map when no components registered', async () => {
			const components = await Effect.runPromise(registry.getAllComponents());

			assert.ok(components instanceof Map);
			assert.strictEqual(components.size, 0);
		});

		it('should return all registered components', async () => {
			const component1 = `---
interface Props {
	title: string;
}
const { title } = Astro.props;
---
<h1>{title}</h1>`;

			const component2 = `---
interface Props {
	count: number;
}
const { count } = Astro.props;
---
<span>{count}</span>`;

			writeFileSync(join(testDir, 'Component1.astro'), component1);
			writeFileSync(join(testDir, 'Component2.astro'), component2);

			await Effect.runPromise(
				registry.registerComponentFromFile(join(testDir, 'Component1.astro'))
			);
			await Effect.runPromise(
				registry.registerComponentFromFile(join(testDir, 'Component2.astro'))
			);

			const components = await Effect.runPromise(registry.getAllComponents());

			assert.strictEqual(components.size, 2);
			assert.ok(components.has('Component1'));
			assert.ok(components.has('Component2'));
		});
	});

	describe('validateProps', () => {
		beforeEach(async () => {
			const astroContent = `---
interface Props {
	title: string;
	count?: number;
	isVisible: boolean;
}

const { title, count = 0, isVisible } = Astro.props;
---

<div>
	<h1>{title}</h1>
	{isVisible && <p>Count: {count}</p>}
</div>`;

			const filePath = join(testDir, 'TestComponent.astro');
			writeFileSync(filePath, astroContent);

			await Effect.runPromise(registry.registerComponentFromFile(filePath));
		});

		it('should validate correct props', async () => {
			const result = await Effect.runPromise(
				registry.validateProps('TestComponent', {
					title: 'Hello',
					count: 5,
					isVisible: true,
				})
			);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it('should validate with optional props missing', async () => {
			const result = await Effect.runPromise(
				registry.validateProps('TestComponent', {
					title: 'Hello',
					isVisible: true,
				})
			);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it('should report missing required props', async () => {
			const result = await Effect.runPromise(
				registry.validateProps('TestComponent', {
					count: 5,
					// Missing title and isVisible
				})
			);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.ok(result.errors.some((e) => e.includes('title')));
			assert.ok(result.errors.some((e) => e.includes('isVisible')));
		});

		it('should report unknown props', async () => {
			const result = await Effect.runPromise(
				registry.validateProps('TestComponent', {
					title: 'Hello',
					isVisible: true,
					unknownProp: 'value',
					anotherUnknown: 123,
				})
			);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 2);
			assert.ok(result.errors.some((e) => e.includes('unknownProp')));
			assert.ok(result.errors.some((e) => e.includes('anotherUnknown')));
		});

		it('should report both missing and unknown props', async () => {
			const result = await Effect.runPromise(
				registry.validateProps('TestComponent', {
					count: 5,
					unknownProp: 'value',
					// Missing title and isVisible, has unknown prop
				})
			);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.length >= 3); // At least 2 missing + 1 unknown
		});

		it('should throw ComponentNotFoundError for unregistered component', async () => {
			await Effect.runPromise(
				registry.validateProps('NonExistent', {}).pipe(
					Effect.catchAll((error) => {
						assert.ok(error instanceof ComponentNotFoundError);
						return Effect.succeed(undefined);
					})
				)
			);
		});
	});

	describe('integration scenarios', () => {
		it('should handle multiple component registration and validation workflow', async () => {
			// Register multiple components
			const buttonComponent = `---
interface Props {
	text: string;
	onClick?: () => void;
	variant?: 'primary' | 'secondary';
	disabled?: boolean;
}

const { text, onClick, variant = 'primary', disabled = false } = Astro.props;
---

<button 
	class={variant} 
	disabled={disabled}
	onclick={onClick}
>
	{text}
</button>`;

			const cardComponent = `---
interface Props {
	title: string;
	content: string;
	footer?: string;
}

const { title, content, footer } = Astro.props;
---

<div class="card">
	<h2>{title}</h2>
	<p>{content}</p>
	{footer && <footer>{footer}</footer>}
</div>`;

			writeFileSync(join(testDir, 'Button.astro'), buttonComponent);
			writeFileSync(join(testDir, 'Card.astro'), cardComponent);

			await Effect.runPromise(registry.registerComponentFromFile(join(testDir, 'Button.astro')));
			await Effect.runPromise(registry.registerComponentFromFile(join(testDir, 'Card.astro')));

			// Validate all components are registered
			const allComponents = await Effect.runPromise(registry.getAllComponents());
			assert.strictEqual(allComponents.size, 2);

			// Test Button validation
			const buttonValidation = await Effect.runPromise(
				registry.validateProps('Button', {
					text: 'Click me',
					variant: 'secondary',
				})
			);
			assert.strictEqual(buttonValidation.valid, true);

			// Test Card validation with error
			const cardValidation = await Effect.runPromise(
				registry.validateProps('Card', {
					title: 'My Card',
					invalidProp: 'should not be here',
					// Missing required 'content' prop
				})
			);
			assert.strictEqual(cardValidation.valid, false);
			assert.ok(cardValidation.errors.some((e) => e.includes('content')));
			assert.ok(cardValidation.errors.some((e) => e.includes('invalidProp')));
		});
	});
});
