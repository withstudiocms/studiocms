/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Effect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { ComponentRegistry } from '../src/registry/index.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Component Registry Tests';

describe(parentSuiteName, () => {
	const testDir = './test-components';
	const REUSABLE_TEST_COMPONENT = 'ReusableTestComponent';
	const REUSABLE_TEST_COMPONENT_FILE = `${REUSABLE_TEST_COMPONENT}.astro`;
	let registry: ComponentRegistry;
	let reusableTestComponent: string;

	beforeEach(async () => {
		mkdirSync(testDir, { recursive: true });

		registry = await Effect.runPromise(
			ComponentRegistry.pipe(Effect.provide(ComponentRegistry.Default))
		);

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

		reusableTestComponent = join(testDir, REUSABLE_TEST_COMPONENT_FILE);
		writeFileSync(reusableTestComponent, astroContent);
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	test('ComponentRegistry - registerComponentFromFile - basic Astro file', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('registerComponentFromFile Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Register component from file', async () => {
			await Effect.runPromise(registry.registerComponentFromFile(filePath));
		});

		await allure.step('Verify component is registered', async (ctx) => {
			const component = await Effect.runPromise(registry.getComponentProps('BasicComponent'));

			expect(component).toBeTruthy();
			expect(component.props).toBeTruthy();
			expect(component.props.length).toBe(3);

			const titleProp = component.props.find((p: any) => p.name === 'title');
			await ctx.parameter('titleProp', JSON.stringify(titleProp));
			expect(titleProp).toBeTruthy();
			expect(titleProp?.optional).toBe(false);
			expect(titleProp?.type).toBe('string');

			const countProp = component.props.find((p: any) => p.name === 'count');
			await ctx.parameter('countProp', JSON.stringify(countProp));
			expect(countProp).toBeTruthy();
			expect(countProp?.optional).toBe(true);
			expect(countProp?.type).toBe('number');

			const isVisibleProp = component.props.find((p: any) => p.name === 'isVisible');
			await ctx.parameter('isVisibleProp', JSON.stringify(isVisibleProp));
			expect(isVisibleProp).toBeTruthy();
			expect(isVisibleProp?.optional).toBe(false);
			expect(isVisibleProp?.type).toBe('boolean');
		});
	});

	test('ComponentRegistry - registerComponentFromFile - custom name', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('registerComponentFromFile Tests');
		await allure.tags(...sharedTags);

		const astroContent = `---
interface Props {
    message: string;
}

const { message } = Astro.props;
---

<p>{message}</p>`;

		const filePath = join(testDir, 'SomeFile.astro');
		writeFileSync(filePath, astroContent);

		await allure.step('Register component with custom name', async () => {
			await Effect.runPromise(registry.registerComponentFromFile(filePath, 'CustomName'));
		});

		await allure.step('Verify component is registered with custom name', async (ctx) => {
			const component = await Effect.runPromise(registry.getComponentProps('CustomName'));

			expect(component).toBeTruthy();
			expect(component.props.length).toBe(1);
			expect(component.props[0].name).toBe('message');

			await ctx.parameter('Registered Component Props', JSON.stringify(component.props));
		});
	});

	// TODO: Refactor registerComponentFromFile/PropsParser to NOT throw on no props, but register with empty props array
	// it makes more sense for the registry to handle this gracefully
	test('ComponentRegistry - registerComponentFromFile - error on no props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('registerComponentFromFile Tests');
		await allure.tags(...sharedTags);

		const astroContent = `---
// No props interface
---

<div>Static content</div>`;

		const filePath = join(testDir, 'StaticComponent.astro');
		writeFileSync(filePath, astroContent);

		await allure.step('Attempt to register component with no props', async (ctx) => {
			const res = await Effect.runPromise(
				registry.registerComponentFromFile(filePath).pipe(
					Effect.catchAll((error: any) => {
						return Effect.succeed(new Error(`Failed to register component: ${error.message}`));
					})
				)
			);

			expect(res instanceof Error).toBe(true);
			await ctx.parameter('Error Message', res instanceof Error ? res.message : 'No error');
		});
	});

	test('ComponentRegistry - registerComponentFromFile - complex prop types', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('registerComponentFromFile Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Register component from file', async () => {
			await Effect.runPromise(registry.registerComponentFromFile(filePath));
		});

		await allure.step('Verify component is registered with complex props', async (ctx) => {
			const component = await Effect.runPromise(registry.getComponentProps('ComplexComponent'));

			expect(component).toBeTruthy();
			expect(component.props.length).toBe(4);

			await ctx.parameter('Registered Component Props', JSON.stringify(component.props));

			const usersProp = component.props.find((p: any) => p.name === 'users');
			await ctx.parameter('usersProp', JSON.stringify(usersProp));
			expect(usersProp).toBeTruthy();
			expect(usersProp?.optional).toBe(false);

			const callbackProp = component.props.find((p: any) => p.name === 'callback');
			await ctx.parameter('callbackProp', JSON.stringify(callbackProp));
			expect(callbackProp).toBeTruthy();
			expect(callbackProp?.optional).toBe(true);

			const metadataProp = component.props.find((p: any) => p.name === 'metadata');
			await ctx.parameter('metadataProp', JSON.stringify(metadataProp));
			expect(metadataProp).toBeTruthy();

			const statusProp = component.props.find((p: any) => p.name === 'status');
			await ctx.parameter('statusProp', JSON.stringify(statusProp));
			expect(statusProp).toBeTruthy();
		});
	});

	test('ComponentRegistry - registerComponentFromFile - non-existent file', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('registerComponentFromFile Tests');
		await allure.tags(...sharedTags);

		const filePath = join(testDir, 'DoesNotExist.astro');

		await allure.step('Attempt to register non-existent component file', async (ctx) => {
			await expect(
				Effect.runPromise(registry.registerComponentFromFile(filePath))
			).rejects.toThrow();

			await ctx.parameter('File Path', filePath);
		});
	});

	test('ComponentRegistry - getComponentProps - registered component', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getComponentProps Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Register component from file', async () => {
			await Effect.runPromise(registry.registerComponentFromFile(filePath));
		});

		await allure.step('Retrieve component props', async (ctx) => {
			const component = await Effect.runPromise(registry.getComponentProps('PersonComponent'));

			expect(component).toBeTruthy();
			expect(component.props.length).toBe(2);

			await ctx.parameter('Component Props', JSON.stringify(component.props));
		});
	});

	test('ComponentRegistry - getComponentProps - unregistered component', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getComponentProps Tests');
		await allure.tags(...sharedTags);

		await allure.step('Attempt to retrieve props for unregistered component', async (ctx) => {
			await expect(Effect.runPromise(registry.getComponentProps('NonExistent'))).rejects.toThrow();

			await ctx.parameter('Component Name', 'NonExistent');
		});
	});

	test('ComponentRegistry - getAllComponents - no components registered', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getAllComponents Tests');
		await allure.tags(...sharedTags);

		await allure.step('Retrieve all components when none are registered', async (ctx) => {
			const components = await Effect.runPromise(registry.getAllComponents());

			expect(components instanceof Map).toBe(true);
			expect(components.size).toBe(0);

			await ctx.parameter('Components Size', String(components.size));
		});
	});

	test('ComponentRegistry - getAllComponents - multiple components registered', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getAllComponents Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Register multiple components', async () => {
			await Effect.runPromise(
				registry.registerComponentFromFile(join(testDir, 'Component1.astro'))
			);
			await Effect.runPromise(
				registry.registerComponentFromFile(join(testDir, 'Component2.astro'))
			);
		});

		await allure.step('Retrieve all registered components', async (ctx) => {
			const components = await Effect.runPromise(registry.getAllComponents());

			expect(components.size).toBe(2);
			expect(components.has('Component1')).toBe(true);
			expect(components.has('Component2')).toBe(true);

			await ctx.parameter('Components Size', String(components.size));
			await ctx.parameter('Registered Components', JSON.stringify(Array.from(components.keys())));
		});
	});

	test('ComponentRegistry - validateProps - valid props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateProps Tests');
		await allure.tags(...sharedTags);

		await Effect.runPromise(registry.registerComponentFromFile(reusableTestComponent));

		const validProps = {
			title: 'Test Title',
			count: 5,
			isVisible: true,
		};

		await allure.step('Validate correct props', async (ctx) => {
			const result = await Effect.runPromise(
				registry.validateProps(REUSABLE_TEST_COMPONENT, validProps)
			);

			expect(result.valid).toBe(true);
			expect(result.errors.length).toBe(0);

			await ctx.parameter('Validation Result', JSON.stringify(result));
		});
	});

	test('ComponentRegistry - validateProps - missing optional props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateProps Tests');
		await allure.tags(...sharedTags);

		await Effect.runPromise(registry.registerComponentFromFile(reusableTestComponent));

		const propsMissingOptional = {
			title: 'Test Title',
			isVisible: false,
		};

		await allure.step('Validate props with optional missing', async (ctx) => {
			const result = await Effect.runPromise(
				registry.validateProps(REUSABLE_TEST_COMPONENT, propsMissingOptional)
			);

			expect(result.valid).toBe(true);
			expect(result.errors.length).toBe(0);

			await ctx.parameter('Validation Result', JSON.stringify(result));
		});
	});

	test('ComponentRegistry - validateProps - missing required props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateProps Tests');
		await allure.tags(...sharedTags);

		await Effect.runPromise(registry.registerComponentFromFile(reusableTestComponent));

		const propsMissingRequired = {
			count: 10,
		};

		await allure.step('Validate props with required missing', async (ctx) => {
			const result = await Effect.runPromise(
				registry.validateProps(REUSABLE_TEST_COMPONENT, propsMissingRequired)
			);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBe(2);
			expect(result.errors.some((e: string) => e.includes('title'))).toBe(true);
			expect(result.errors.some((e: string) => e.includes('isVisible'))).toBe(true);

			await ctx.parameter('Validation Result', JSON.stringify(result));
		});
	});

	test('ComponentRegistry - validateProps - unknown props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateProps Tests');
		await allure.tags(...sharedTags);

		await Effect.runPromise(registry.registerComponentFromFile(reusableTestComponent));

		const propsWithUnknown = {
			title: 'Test Title',
			isVisible: true,
			unknownProp: 'value',
			anotherUnknown: 123,
		};

		await allure.step('Validate props with unknown properties', async (ctx) => {
			const result = await Effect.runPromise(
				registry.validateProps(REUSABLE_TEST_COMPONENT, propsWithUnknown)
			);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBe(2);
			expect(result.errors.some((e: string) => e.includes('unknownProp'))).toBe(true);
			expect(result.errors.some((e: string) => e.includes('anotherUnknown'))).toBe(true);

			await ctx.parameter('Validation Result', JSON.stringify(result));
		});
	});

	test('ComponentRegistry - validateProps - both missing and unknown props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateProps Tests');
		await allure.tags(...sharedTags);

		await Effect.runPromise(registry.registerComponentFromFile(reusableTestComponent));

		const propsMissingAndUnknown = {
			count: 5,
			unknownProp: 'value',
		};

		await allure.step('Validate props with both missing and unknown properties', async (ctx) => {
			const result = await Effect.runPromise(
				registry.validateProps(REUSABLE_TEST_COMPONENT, propsMissingAndUnknown)
			);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(3); // At least 2 missing + 1 unknown

			await ctx.parameter('Validation Result', JSON.stringify(result));
		});
	});

	test('ComponentRegistry - validateProps - unregistered component', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('validateProps Tests');
		await allure.tags(...sharedTags);

		const someProps = {
			title: 'Test Title',
			isVisible: true,
		};

		await allure.step('Validate props for unregistered component', async (ctx) => {
			await expect(
				Effect.runPromise(registry.validateProps('NonExistent', someProps))
			).rejects.toThrow();

			await ctx.parameter('Component Name', 'NonExistent');
		});
	});

	test('ComponentRegistry - Integration Tests - multiple components workflow', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Scenarios');
		await allure.tags(...sharedTags);

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

		await allure.step('Register Button component', async () => {
			await Effect.runPromise(registry.registerComponentFromFile(join(testDir, 'Button.astro')));
		});

		await allure.step('Register Card component', async () => {
			await Effect.runPromise(registry.registerComponentFromFile(join(testDir, 'Card.astro')));
		});

		await allure.step('Validate Button component props', async (ctx) => {
			const buttonValidation = await Effect.runPromise(
				registry.validateProps('Button', {
					text: 'Click me',
					variant: 'secondary',
				})
			);

			expect(buttonValidation.valid).toBe(true);

			await ctx.parameter('Button Validation Result', JSON.stringify(buttonValidation));
		});

		await allure.step('Validate Card component props with errors', async (ctx) => {
			const cardValidation = await Effect.runPromise(
				registry.validateProps('Card', {
					title: 'My Card',
					invalidProp: 'should not be here',
				})
			);

			expect(cardValidation.valid).toBe(false);
			expect(cardValidation.errors.some((e: string) => e.includes('content'))).toBe(true);
			expect(cardValidation.errors.some((e: string) => e.includes('invalidProp'))).toBe(true);

			await ctx.parameter('Card Validation Result', JSON.stringify(cardValidation));
		});
	});
});
