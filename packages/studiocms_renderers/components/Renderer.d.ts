export interface Props {
	content: string;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	[name: string]: any;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
// biome-ignore lint/style/noVar: <explanation>
export var Renderer: (props: Props) => any;

export default Renderer;
