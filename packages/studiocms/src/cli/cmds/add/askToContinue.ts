import type { ClackPrompts } from './utils.js';

export async function askToContinue(p: ClackPrompts): Promise<boolean> {
	const response = await p.confirm({
		message: 'Continue?',
		initialValue: true,
	});

	if (p.isCancel(response)) {
		return false;
	}

	return response;
}
