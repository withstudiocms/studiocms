import type { Editor } from 'grapesjs';
import type { RequiredTooltipOptions } from '../types';

export const tooltipComponent = (editor: Editor, opts: RequiredTooltipOptions) => {
	// Setup tooltip block
	const {
		id: tooltipId,
		labelTooltip,
		classTooltip,
		attrTooltip,
		style,
		styleAdditional,
		extendTraits,
		showTooltipOnStyle,
		propsTooltip,
		stylableTooltip,
	} = opts;

	const classTooltipBody = `${classTooltip}__body`;
	const classTooltipEmpty = `${classTooltip}--empty`;
	const attrTooltipVis = `${attrTooltip}-visible`;
	const attrTooltipPos = `${attrTooltip}-pos`;
	const attrTooltipLen = `${attrTooltip}-length`;
	const traitIdStyleTooltip = 'style-tooltip';

	editor.Components.addType(tooltipId, {
		isComponent: (el) => el.hasAttribute?.(attrTooltip),
		model: {
			defaults: {
				name: labelTooltip,
				classes: [classTooltip],
				attributes: { [attrTooltip]: labelTooltip },
				styles:
					(style ||
						`
          .${classTooltip} {
            position: relative;
            display: inline-block;
            vertical-align: top;
          }

          .${classTooltipEmpty} {
            width: 50px;
            height: 50px;
          }

          .${classTooltipBody},
          [${attrTooltip}]::after {
            font-family: Helvetica, sans-serif;
            background: rgba(55, 61, 73, 0.95);
            border-radius: 3px;
            bottom: 100%;
            color: #fff;
            content: attr(${attrTooltip});
            display: block;
            font-size: 12px;
            left: 50%;
            line-height: normal;
            max-width: 32rem;
            opacity: 0;
            overflow: hidden;
            padding: 8px 16px;
            pointer-events: none;
            position: absolute;
            text-overflow: ellipsis;
            transform: translate(-50%, 0);
            transition: opacity 0.25s, transform 0.25s;
            white-space: nowrap;
            box-sizing: border-box;
            z-index: 10;
          }

          [${attrTooltipVis}=true]::after,
          [${attrTooltip}]:focus::after,
          [${attrTooltip}]:hover::after {
            opacity: 1;
            transform: translate(-50%, -0.5rem);
          }

          [${attrTooltipPos}=right]::after {
            bottom: 50%;
            left: 100%;
            transform: translate(0, 50%);
          }

          [${attrTooltipPos}=right]:focus::after,
          [${attrTooltipPos}=right]:hover::after,
          [${attrTooltipVis}=true][${attrTooltipPos}=right]::after {
            transform: translate(0.5rem, 50%);
          }

          [${attrTooltipPos}=bottom]::after {
            bottom: auto;
            top: 100%;
            transform: translate(-50%, 0);
          }

          [${attrTooltipPos}=bottom]:focus::after,
          [${attrTooltipPos}=bottom]:hover::after,
          [${attrTooltipVis}=true][${attrTooltipPos}=bottom]::after {
            transform: translate(-50%, 0.5rem);
          }

          [${attrTooltipPos}=left]::after {
            bottom: 50%;
            left: auto;
            right: 100%;
            transform: translate(0, 50%);
          }

          [${attrTooltipPos}=left]:focus::after,
          [${attrTooltipPos}=left]:hover::after,
          [${attrTooltipVis}=true][${attrTooltipPos}=left]::after {
            transform: translate(-0.5rem, 50%);
          }

          [${attrTooltipLen}=small]::after {
            white-space: normal;
            width: 80px;
          }

          [${attrTooltipLen}=medium]::after {
            white-space: normal;
            width: 150px;
          }

          [${attrTooltipLen}=large]::after {
            white-space: normal;
            width: 300px;
          }

          [${attrTooltipLen}=fit]::after {
            white-space: normal;
            width: 100%;
          }

          // IE 11 bugfix
          button[${attrTooltip}] {
            overflow: visible;
          }
        `) + styleAdditional,
				// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
				traits: extendTraits!([
					{
						name: attrTooltip,
						label: 'Text',
					},
					{
						name: attrTooltipPos,
						label: 'Position',
						type: 'select',
						options: [
							{
								value: 'top',
								name: 'Top',
								id: '',
							},
							{
								value: 'right',
								name: 'Right',
								id: '',
							},
							{
								value: 'bottom',
								name: 'Bottom',
								id: '',
							},
							{
								value: 'left',
								name: 'Left',
								id: '',
							},
						],
					},
					{
						name: attrTooltipLen,
						label: 'Length',
						type: 'select',
						options: [
							{
								value: '',
								name: 'One line',
								id: '',
							},
							{
								value: 'small',
								name: 'Small',
								id: '',
							},
							{
								value: 'medium',
								name: 'Medium',
								id: '',
							},
							{
								value: 'large',
								name: 'Large',
								id: '',
							},
							{
								value: 'fit',
								name: 'Fit',
								id: '',
							},
						],
					},
					{
						name: attrTooltipVis,
						label: 'Visible',
						type: 'checkbox',
						valueTrue: 'true',
					},
					{
						name: traitIdStyleTooltip,
						labelButton: 'Style tooltip',
						type: 'button',
						full: true,
						command: (editor) => {
							const openSm = editor.Panels.getButton('views', 'open-sm');
							openSm?.set('active', true);
							const ruleTooltip = editor.Css.getRules(`.${classTooltipBody}`)[0];
							ruleTooltip.set('stylable', stylableTooltip);
							editor.StyleManager.select(ruleTooltip);

							if (showTooltipOnStyle) {
								const selected = editor.getSelected();
								if (selected?.is(tooltipId)) {
									selected.addAttributes({ [attrTooltipVis]: 'true' });
									editor.once('style:target', () => {
										selected.addAttributes({ [attrTooltipVis]: 'false' });
									});
								}
							}
						},
					},
				]),
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
				...(propsTooltip as any),
			},

			init() {
				this.listenTo(this.components(), 'add remove', this.checkEmpty);
				this.checkEmpty();
			},

			checkEmpty() {
				const empty = !this.components().length;
				this[empty ? 'addClass' : 'removeClass'](`${classTooltipEmpty}`);
			},
		},
	});
};

export default tooltipComponent;
