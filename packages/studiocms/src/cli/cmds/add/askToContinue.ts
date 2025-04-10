import * as p from '@clack/prompts';

export async function askToContinue(): Promise<boolean> {
	const response = await p.confirm({
		message: 'Continue?',
		initialValue: true,
	});

	if (p.isCancel(response)) {
		return false;
	}

	return response;
}
