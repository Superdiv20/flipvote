import { describe, expect, test } from 'bun:test';
import { DECKS } from '@flipvote/protocol';
import { calculateResult } from '../../../room/round/calculate-result';

describe('calculateResult', () => {
	test('averages numeric votes and lists the distribution in deck order', () => {
		expect(calculateResult(['8', '5', '3', '5', '5', '5'], DECKS.fibonacci)).toEqual({
			voteCount: 6,
			average: 31 / 6,
			distribution: [
				{ value: '3', count: 1 },
				{ value: '5', count: 4 },
				{ value: '8', count: 1 },
			],
			consensus: null,
			suggestedEstimate: '5',
		});
	});

	test('keeps non-numeric cards out of the average but in the distribution', () => {
		const result = calculateResult(['?', '3', 'coffee', '5'], DECKS.fibonacci);
		expect(result.average).toBe(4);
		expect(result.voteCount).toBe(4);
		expect(result.distribution.map((row) => row.value)).toEqual(['3', '5', '?', 'coffee']);
	});

	test('reports consensus when at least two people agree', () => {
		expect(calculateResult(['5', '5'], DECKS.fibonacci).consensus).toBe('5');
		expect(calculateResult(['5'], DECKS.fibonacci).consensus).toBeNull();
	});

	test('suggests the higher card on a tie', () => {
		expect(calculateResult(['3', '8', '3', '8'], DECKS.fibonacci).suggestedEstimate).toBe('8');
	});

	test('counts ½ as a number', () => {
		expect(calculateResult(['0.5', '1'], DECKS['modified-fibonacci']).average).toBe(0.75);
	});

	test('has no average or estimate for T-shirt sizes', () => {
		const result = calculateResult(['M', 'L', 'M'], DECKS['t-shirt']);
		expect(result.average).toBeNull();
		expect(result.suggestedEstimate).toBeNull();
		expect(result.distribution).toEqual([
			{ value: 'M', count: 2 },
			{ value: 'L', count: 1 },
		]);
	});
});
