# @studiocms/ui

This is the UI library that we use to build StudioCMS.

All of these components can be tested [here](https://ui-testing.studiocms.dev).

## Components & how to use them
All components are exported from `@studiocms/ui/components`.

### Button
A simple button component. Use it like this:

```html
<Button>Hello World!</Button>
```

You can pass the following props:
```ts
type Props = {
  as?: As; // What the button should be rendered as. Set to "a" for an anchor tag, etc.
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean; // Make the button take up full width
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'outlined' | 'flat';
  class?: string;
  disabled?: boolean;
  // Note: you can pass all other HTML attributes and they will be applied.
};
```

### Card
A simple card component with support for a header and footer. Use it like this:
```html
<Card>
  <div slot="header">Header Content</div>
  <div>Body Content</div> <!-- No slot definition needed for the body! -->
  <div slot="footer">Footer Content</div>
</Card>
```

You can pass the following props:
```ts
type Props = {
  as?: As;
  class?: string;
  fullWidth?: boolean;
  fullHeight?: boolean;
};
```

### Center
A component that automatically centers all of it's content. Use it like this:
```html
<Center>Content in here will be centered!</Center>
```

### Checkbox
A checkbox component. Use it like this:
```html
<Checkbox
  label="Label"
/>
```

You can pass the following props:
```ts
type Props = {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string; // If you want to use this in forms. If unset, a name will be auto-generated.
  isRequired?: boolean;
};
```

### Divider
A simple divider. Use it like this:
```html
<Divider>Divider Label</Divider>
```

### Dropdown
A dropdown component. Use it like this:
```html
<Dropdown
  options={[
    { label: 'Option 1', value: 'opt-1' },
    { label: 'Option 2', value: 'opt-2' },
  ]}
  id='dropdown'
>
   <div slot="icon-start"><!-- Icon goes here --></div>
  <div>Your Trigger goes here!</div>
   <div slot="icon-end"><!-- Icon goes here --></div>
</Dropdown>
```
**This component needs a helper to function.** Add it in a script tag:
```html
<script>
  import { DropdownHelper } from "@studiocms/ui/components";

  const dropdown1 = new DropdownHelper('dropdown-1');
  dropdown1.registerClickCallback((value) => {
    // "value" will be what you put in the options.
    // When an option is clicked, it will supply its value here
    console.log(value);
  });
</script>
```
You can pass the following props:
```ts
type Option = {
  label: string;
  value: string;
  disabled?: boolean;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
};

type Props = {
  id: string;
  options: Option[];
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
  triggerOn?: 'left' | 'right' | 'both';
};
```

### Input
A text input. Use it like this:
```html
<Input />
```
You can pass the following props:
```ts
type Props = {
  label?: string;
  type?: 'text' | 'password';
  placeholder?: string;
  isRequired?: boolean;
  name?: string;
  disabled?: boolean;
  defaultValue?: string;
  class?: string;
};
```

### Modal
A modal component with form support. Use it like this:
```html
<Modal id="modal">
  <!-- This component has a header slot! Use it like this: -->
  <h2 slot="header">Header content</h2>
  <div>Modal content</div>
</Modal>
<Button id="modal-trigger">Open Modal</Button>
```
**This component needs a helper to function.** Add it in a script tag:
```html
<script>
  import { ModalHelper } from "@studiocms/ui/components";

  const modal = new ModalHelper('modal');
  modal.bindTrigger('modal-trigger');
</script>
```
You can make the modal a form and also display "confirm" and "cancel" buttons individually:
```html
<Modal id="modal" isForm buttons={['confirm', 'cancel']}>
  <h2 slot="header">Header content</h2>
  <div>Modal content</div>
</Modal>
<Button id="modal-trigger">Open Modal</Button>
```
*Note: The order in which you supply the buttons does not change the buttons order in the modal.*

After adding a button, you can register a callback that will be fired when a button is clicked. If you made the modal a form, this will also give you a way to access the form data:
```html
<script>
  import { ModalHelper } from "@studiocms/ui/components";

  const modal = new ModalHelper('modal');
  modal.bindTrigger('modal-trigger');
  
  // The cancel callback will not be supplied the formData, even if you made the modal a form.
  modal.registerCancelCallback(() => {
    // Your cancellation logic
  });

  // formData will be undefined unless you set the isForm prop!
  modal.registerConfirmCallback((formData) => {
    // Your confirmation logic
  });
</script>
```
You can pass the following props:
```ts
type Props = {
  id: string;
  size?: 'sm' | 'md' | 'lg';
  dismissable?: boolean;
  buttons?: ('confirm' | 'cancel')[];
  isForm?: boolean;
};
```

### RadioGroup
A radio group. Use it like this:
```html
<RadioGroup
  label="Label"
  options={[
    { label: "Option 1", value: "opt-1" },
    { label: "Option 2", value: "opt-2" },
    { label: "Option 3", value: "opt-3" }
  ]}
/>
```
You can pass the following props:
```ts
type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Props = {
  label: string;
  options: Option[];
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  defaultValue?: string; // Needs to be the value of an option!
  disabled?: boolean;
  name?: string;
  isRequired?: boolean;
  horizontal?: boolean;
  class?: string;
};
```

### Row
A simple row component, essentially a flex div to wrap stuff in. Use it like this:
```html
<Row>
  <Button>These two will be...</Button>
  <Button>in a row!</Button>
</Row>
```
You can pass the following props:
```ts
type Props = {
  alignCenter?: boolean;
  gapSize?: 'sm' | 'md' | 'lg';
};
```

### Select
A select component. Use it like this:
```html
<Select
  label='Select'
  options={[
    { label: "Option 1", value: "opt-1" },
    { label: "Option 2", value: "opt-2" },
    { label: "Option 3", value: "opt-3" },
  ]}
/>
```
You can pass the following props:
```ts
type Option = {
	label: string;
	value: string;
	disabled?: boolean;
};

type Props = {
	label?: string;
	defaultValue?: string;
	class?: string;
	name?: string;
	isRequired?: boolean;
	options: Option[];
	disabled?: boolean;
	fullWidth?: boolean;
};
```

### Sidebar
The sidebar comes in two flavors: single and double. **Each requires a helper and functions slightly differently.** We recommend you use these in a layout. If you do, make sure to make the sidebar's parent a flex-div with `flex-direction: row` and set it to `height: 100vh` or `height: 100dvh`. The sidebar might not work correctly otherwise.

#### Single Sidebar
The layout of your page should look similar to this:
```html
<main>
  <Sidebar>
    Sidebar Content (anchor tags etc.)
  </Sidebar>
  <div class="content">
    <!-- 
      This will be the trigger for your sidebar. 
      You can use whatever you want here, like an icon.
      We recommend placing this in the upper left corner of the screen.
    -->
    <Button id='sidebar-toggle'>
      Sidebar toggle.
    </Button>
    
    <slot /> <!-- The slot for your content -->
  </div>
</main>
<style>
  .main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
  }
</style>
<script>
  import { SingleSidebarHelper } from "@studiocms/ui/components";

  // Use the ID of your trigger here!
  new SingleSidebarHelper('sidebar-toggle');
</script>
```

We recommend you use the same button to both show and hide the sidebar, and that you hide it on devides with a screen size larger than `840px`.

If needed, it is possible to register elements to open / close the sidebar manually:
```html
<script>
  import { SingleSidebarHelper } from "@studiocms/ui/components";

  const sidebar = new SingleSidebarHelper();

  // Use the IDs of the respective elements here:
  sidebar.hideSidebarOnClick('another-elements-id');
  sidebar.showSidebarOnClick('another-elements-id');
</script>
```
You can even just use the barebones function calls if you need to close the sidebar programatically:
```html
<script>
  import { SingleSidebarHelper } from "@studiocms/ui/components";

  const sidebar = new SingleSidebarHelper();
  
  sidebar.hideSidebar();
  sidebar.showSidebar();
</script>
```

#### Double Sidebar
When using the double sidebar, the layout of your page should look similar to this:
```html
<main class="main">
  <DoubleSidebar>
    <div slot="outer" class="outer">
      <Button id='to-inner'>
        To Inner Sidebar
      </Button>
    </div>
    <div slot="inner">
      <Button id='to-outer'>
        To Outer Sidebar
      </Button>
      <Button id='to-content'>
        To Content
      </Button>
    </div>
  </DoubleSidebar>
  <div class="content">
    <Button id='sidebar-toggle'>
      Sidebar toggle.
    </Button>
    <slot />
  </div>
</main>
<style>
  .main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
</style>
<script>
  import { DoubleSidebarHelper } from "@studiocms/ui/components";

  // The helper. Pass in the initial sidebar trigger id and the 
  // id for the button to switch from inner to outer sidebar on
  // mobile devices.
  const dbsb = new DoubleSidebarHelper('sidebar-toggle', 'to-outer');

  // The id for the element to show the inner sidebar when clicked. 
  // Should be used when the user is currently on the outer sidebar 
  // and needs to switch to the inner.
  dbsb.showInnerOnClick('to-inner');

  // The id for the element to show the content on click. Should
  // be used from the inner sidebar when the user wants to see the
  // page content.
  dbsb.showContentOnClick('to-content');
</script>
```
The double sidebar, like the single sidebar, supports individual function calls to show and hide the outer or inner navbars programatically:

```html
<script>
  import { DoubleSidebarHelper } from "@studiocms/ui/components";

  const sidebar = new DoubleSidebarHelper('sidebar-toggle', 'to-outer');

  sidebar.hideSidebar();
  sidebar.showInnerSidebar();
  sidebar.showOuterSidebar();
</script>
```
*Note: The API (especially for the double sidebar) is highly likely to change to make it easier to use.*

### Textarea
A simple textarea component. Use it like this:
```html
<Textarea />
```
You can pass the following props:
```ts
type Props = {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  fullWidth?: boolean;
  resize?: boolean;
  name?: string;
  disabled?: boolean;
  defaultValue?: string;
};
```

### Toast
A component and helper for toasts. Use the component like this *(we recommend placing it in a layout)*:
```html
<Toaster />
```
You can pass the following props to the `<Toaster />` component:
```ts
type Props = {
	position?:
		| 'top-left'
		| 'top-right'
		| 'top-center'
		| 'bottom-left'
		| 'bottom-right'
		| 'bottom-center';
	class?: string;
	duration?: number;
	expand?: boolean;
	closeButton?: boolean;
	offset?: number;
	gap?: number;
};
```
**This component needs a helper to function.** You can create toasts from a script tag:
```html
<script>
  import { toast } from '@studiocms/ui/components';

  toast({
    title: "Toast Title",
    type: 'info',
  });
</script>
```
Only a title and a type are required to create a toast. However, you can pass the following options to customize it a little more:
```ts
type Props = {
  title: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  description?: string;
  duration?: number;
  closeButton?: boolean;
  persistent?: boolean; // When set to true, you MUST set "closeButton" to true as well.
};
```

### Toggle
A toggle component, essentially a checkbox with different design. Use it like this:
```html
<Toggle label='Label' />
```
You can pass the following props:
```ts
type Props = {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  isRequired?: boolean;
};
```

### User
A helper to display a user. Use it like this:
```html
<User 
  name="Louis Escher"
  description='UI/UX & Developer'
/>
```
Optionally, you can pass an avatar to be shown instead of the default placeholder, and also pass a class name for the container:
```html
<User 
  name='Louis Escher'
  description='UI/UX & Developer'
  avatar='https://avatars.githubusercontent.com/u/66965600?v=4'
  class="mt-4" 
/>
```

## Planned

### Based on popover API
- Tooltips based on popover & anchor positioning API (not supported at time of writing, needs a custom solution)
- Date Picker

### Loading Stuff
- Skeleton
- Spinners

### Other Stuff
- Image dropzone

### Otter Stuff
- Markdown editor (WYSIWYG (thanks Otter <3))

### Maybe's
- Implement tailwind's prose
- Maybe starlight props.css
