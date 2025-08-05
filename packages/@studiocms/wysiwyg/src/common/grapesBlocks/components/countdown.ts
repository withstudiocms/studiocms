import type { Editor } from 'grapesjs';
import type { RequiredCountdownOptions } from '../types.js';
import { AddComponent } from './index.js';

type TElement = HTMLElement & {
	__gjsCountdownInterval: ReturnType<typeof setTimeout | typeof setInterval>;
};

declare global {
	interface Window {
		__gjsCountdownIntervals: TElement[];
	}
}

export default (editor: Editor, opts: RequiredCountdownOptions) => {
	const addComponent = AddComponent(editor);

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

	addComponent(countdownId, {
		model: {
			defaults: {
				startfrom: countdownStartTime,
				classes: [countdownPfx],
				endText: countdownEndText,
				droppable: false,
				// biome-ignore lint/suspicious/noExplicitAny: grapesjs types
				script(props: Record<string, any>) {
					const startfrom: string = props.startfrom;
					const endTxt: string = props.endText;
					const countDownDate = new Date(startfrom).getTime();
					const countdownEl = this.querySelector('[data-js=countdown]') as HTMLElement;
					const endTextEl = this.querySelector('[data-js=countdown-endtext]') as HTMLElement;
					// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
					const dayEl = this.querySelector('[data-js=countdown-day]')!;
					// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
					const hourEl = this.querySelector('[data-js=countdown-hour]')!;
					// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
					const minuteEl = this.querySelector('[data-js=countdown-minute]')!;
					// biome-ignore lint/style/noNonNullAssertion: This is the type that was already used in the original code
					const secondEl = this.querySelector('[data-js=countdown-second]')!;
					const oldInterval = (this as unknown as TElement).__gjsCountdownInterval;
					if (oldInterval) clearInterval(oldInterval);

					const connected: TElement[] = window.__gjsCountdownIntervals || [];
					const toClean: TElement[] = [];
					connected.forEach((item: TElement) => {
						if (!item.isConnected) {
							clearInterval(item.__gjsCountdownInterval);
							toClean.push(item);
						}
					});
					// biome-ignore lint/suspicious/noExplicitAny: types are stupid anyway
					connected.indexOf(this as any) < 0 && connected.push(this as any);
					window.__gjsCountdownIntervals = connected.filter((item) => toClean.indexOf(item) < 0);

					const setTimer = (days: number, hours: number, minutes: number, seconds: number) => {
						dayEl.innerHTML = `${days < 10 ? `0${days}` : days}`;
						hourEl.innerHTML = `${hours < 10 ? `0${hours}` : hours}`;
						minuteEl.innerHTML = `${minutes < 10 ? `0${minutes}` : minutes}`;
						secondEl.innerHTML = `${seconds < 10 ? `0${seconds}` : seconds}`;
					};

					const MS_PER_DAY = 86400000;
					const MS_PER_HOUR = 3600000;
					const MS_PER_MINUTE = 60000;
					const MS_PER_SECOND = 1000;

					const moveTimer = () => {
						// biome-ignore lint/complexity/useDateNow: This is the type that was already used in the original code
						const now = new Date().getTime();
						const distance = countDownDate - now;
						const days = Math.floor(distance / MS_PER_DAY);
						const hours = Math.floor((distance % MS_PER_DAY) / MS_PER_HOUR);
						const minutes = Math.floor((distance % MS_PER_HOUR) / MS_PER_MINUTE);
						const seconds = Math.floor((distance % MS_PER_MINUTE) / MS_PER_SECOND);

						setTimer(days, hours, minutes, seconds);

						if (distance < 0) {
							clearInterval((this as unknown as TElement).__gjsCountdownInterval);
							endTextEl.innerHTML = endTxt;
							countdownEl.style.display = 'none';
							endTextEl.style.display = '';
						}
					};

					if (countDownDate) {
						(this as unknown as TElement).__gjsCountdownInterval = setInterval(moveTimer, 1000);
						endTextEl.style.display = 'none';
						countdownEl.style.display = '';
						moveTimer();
					} else {
						setTimer(0, 0, 0, 0);
					}
				},
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
