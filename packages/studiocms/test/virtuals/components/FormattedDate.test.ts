/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import FormattedDate from '../../../src/virtuals/components/FormattedDate.astro';
import { cleanAstroAttributes } from '../../test-utils';

describe('FormattedDate component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(FormattedDate, {
			props: { date: new Date('2020-01-01'), __test_mode: true },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/FormattedDate.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
