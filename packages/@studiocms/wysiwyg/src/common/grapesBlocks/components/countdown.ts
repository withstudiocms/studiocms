import type { AddComponentTypeOptions, Editor } from 'grapesjs';
import type { RequiredCountdownOptions } from '../types.js';

type TElement = HTMLElement & { __gjsCountdownInterval: NodeJS.Timer };

declare global {
    interface Window {
        __gjsCountdownIntervals: TElement[];
    }
}

export default (editor: Editor, opts: RequiredCountdownOptions) => {
	const addComponent = (id: string, def: AddComponentTypeOptions) => {
		editor.Components.addType(id, def);
	};

	// Setup countdown block
	const {
		props: countdownProps,
		style: countdownStyle,
		id: countdownId,
		classPrefix: countdownPfx,
		startTime: countdownStartTime,
		endText: countdownEndText,
		dateInputType: countdownDateInputType,
		labelDays: countdownLabelDays,
		labelHours: countdownLabelHours,
		labelMinutes: countdownLabelMinutes,
		labelSeconds: countdownLabelSeconds,
		styleAdditional: countdownStyleAdditional,
	} = opts;

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	const countdownScript = function (props: Record<string, any>) {
		const startfrom: string = props.startfrom;
		const endTxt: string = props.endText;
		// @ts-ignore
		// biome-ignore lint/complexity/noUselessThisAlias: This is the type that was already used in the original code
		const el: TElement = this;
		const countDownDate = new Date(startfrom).getTime();
		const countdownEl = el.querySelector('[data-js=countdown]') as HTMLElement;
		const endTextEl = el.querySelector('[data-js=countdown-endtext]') as HTMLElement;
		// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
		const dayEl = el.querySelector('[data-js=countdown-day]')!;
		// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
		const hourEl = el.querySelector('[data-js=countdown-hour]')!;
		// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
		const minuteEl = el.querySelector('[data-js=countdown-minute]')!;
		// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
		const secondEl = el.querySelector('[data-js=countdown-second]')!;
		const oldInterval = el.__gjsCountdownInterval;
		// @ts-ignore
		oldInterval && clearInterval(oldInterval);

		const connected: TElement[] = window.__gjsCountdownIntervals || [];
		const toClean: TElement[] = [];
		connected.forEach((item: TElement) => {
			if (!item.isConnected) {
				// @ts-ignore
				clearInterval(item.__gjsCountdownInterval);
				toClean.push(item);
			}
		});
		connected.indexOf(el) < 0 && connected.push(el);
		window.__gjsCountdownIntervals = connected.filter((item) => toClean.indexOf(item) < 0);

		const setTimer = (days: number, hours: number, minutes: number, seconds: number) => {
			dayEl.innerHTML = `${days < 10 ? `0${days}` : days}`;
			hourEl.innerHTML = `${hours < 10 ? `0${hours}` : hours}`;
			minuteEl.innerHTML = `${minutes < 10 ? `0${minutes}` : minutes}`;
			secondEl.innerHTML = `${seconds < 10 ? `0${seconds}` : seconds}`;
		};

		const moveTimer = () => {
			// biome-ignore lint/complexity/useDateNow: This is the type that was already used in the original code
			const now = new Date().getTime();
			const distance = countDownDate - now;
			const days = Math.floor(distance / 86400000);
			const hours = Math.floor((distance % 86400000) / 3600000);
			const minutes = Math.floor((distance % 3600000) / 60000);
			const seconds = Math.floor((distance % 60000) / 1000);

			setTimer(days, hours, minutes, seconds);

			if (distance < 0) {
				// @ts-ignore
				clearInterval(el.__gjsCountdownInterval);
				endTextEl.innerHTML = endTxt;
				countdownEl.style.display = 'none';
				endTextEl.style.display = '';
			}
		};

		if (countDownDate) {
			el.__gjsCountdownInterval = setInterval(moveTimer, 1000);
			endTextEl.style.display = 'none';
			countdownEl.style.display = '';
			moveTimer();
		} else {
			setTimer(0, 0, 0, 0);
		}
	};

	addComponent(countdownId, {
		model: {
			defaults: {
				startfrom: countdownStartTime,
				classes: [countdownPfx],
				endText: countdownEndText,
				droppable: false,
				script: countdownScript,
				'script-props': ['startfrom', 'endText'],
				traits: [
					{
						label: 'Start',
						name: 'startfrom',
						changeProp: true,
						type: countdownDateInputType,
					},
					{
						label: 'End text',
						name: 'endText',
						changeProp: true,
					},
				],
				// @ts-ignore
				components: `
              <span data-js="countdown" class="${countdownPfx}-cont">
                <div class="${countdownPfx}-block">
                  <div data-js="countdown-day" class="${countdownPfx}-digit"></div>
                  <div class="${countdownPfx}-label">${countdownLabelDays}</div>
                </div>
                <div class="${countdownPfx}-block">
                  <div data-js="countdown-hour" class="${countdownPfx}-digit"></div>
                  <div class="${countdownPfx}-label">${countdownLabelHours}</div>
                </div>
                <div class="${countdownPfx}-block">
                  <div data-js="countdown-minute" class="${countdownPfx}-digit"></div>
                  <div class="${countdownPfx}-label">${countdownLabelMinutes}</div>
                </div>
                <div class="${countdownPfx}-block">
                  <div data-js="countdown-second" class="${countdownPfx}-digit"></div>
                  <div class="${countdownPfx}-label">${countdownLabelSeconds}</div>
                </div>
              </span>
              <span data-js="countdown-endtext" class="${countdownPfx}-endtext"></span>
            `,
				styles:
					(countdownStyle ||
						`
              .${countdownPfx} {
                text-align: center;
              }
    
              .${countdownPfx}-block {
                display: inline-block;
                margin: 0 10px;
                padding: 10px;
              }
    
              .${countdownPfx}-digit {
                font-size: 5rem;
              }
    
              .${countdownPfx}-endtext {
                font-size: 5rem;
              }
    
              .${countdownPfx}-cont {
                display: inline-block;
              }
            `) + countdownStyleAdditional,
				...countdownProps,
			},
		},
	});
};
