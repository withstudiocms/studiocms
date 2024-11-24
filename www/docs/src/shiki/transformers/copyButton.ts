import { h } from 'hastscript';
import type { ShikiTransformer } from 'shiki';

export function addCopyButton(options?: { toggle?: number }): ShikiTransformer {
	const toggleMs = options?.toggle || 3000;

	return {
		name: 'shiki-transformer-copy-button',
		pre(node) {
			const button = h(
				'button',
				{
					class: 'copy',
					'data-code': this.source,
					title: 'Copy code to clipboard',
					ariaLabel: 'Copy code to clipboard',
					onclick: `
          navigator.clipboard.writeText(this.dataset.code);
          this.classList.add('copied');
          setTimeout(() => this.classList.remove('copied'), ${toggleMs})
        `,
				},
				[
					h('span', { class: 'ready' }, [
						h(
							'svg',
							{
								xmlns: 'http://www.w3.org/2000/svg',
								fill: 'none',
								width: 24,
								height: 24,
								viewBox: '0 0 24 24',
								stroke: 'var(--copy-button)',
								strokeWidth: '1.5',
							},
							[
								h('path', {
									strokeLinecap: 'round',
									strokeLinejoin: 'round',
									d: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
								}),
							]
						),
					]),
					h('span', { class: 'success' }, [
						h(
							'svg',
							{
								xmlns: 'http://www.w3.org/2000/svg',
								width: 24,
								height: 24,
								viewBox: '0 0 24 24',
								strokeWidth: '1.5',
								fill: 'none',
								stroke: 'var(--copy-button-success)',
							},
							[
								h('path', {
									strokeLinecap: 'round',
									strokeLinejoin: 'round',
									d: 'm4.5 12.75 6 6 9-13.5',
								}),
							]
						),
					]),
				]
			);

			node.children.push(button);
		},
	};
}

export default addCopyButton;
