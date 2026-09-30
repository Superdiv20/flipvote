import type { CardValue, Deck, RoundResult } from '@flipvote/protocol';

/**
 * Summarises the votes of a round. Non-numeric cards (`?`, `coffee`, T-shirt sizes) appear in the
 * distribution but not in the average or the suggested estimate.
 */
export function calculateResult(votes: readonly CardValue[], deck: Deck): RoundResult {
	const counts = new Map<CardValue, number>();
	for (const value of votes) counts.set(value, (counts.get(value) ?? 0) + 1);

	const numbers = votes.filter(isNumeric).map(Number);
	const average = numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : null;

	const position = (value: CardValue) => {
		const index = deck.cards.indexOf(value);
		return index === -1 ? deck.cards.length : index;
	};
	const distribution = [...counts]
		.map(([value, count]) => ({ value, count }))
		.sort((a, b) => position(a.value) - position(b.value));

	const consensus = votes.length >= 2 && counts.size === 1 ? votes[0]! : null;

	// Distribution is in deck order, so `>=` lets the higher card win a tie.
	let top: { value: CardValue; count: number } | null = null;
	for (const row of distribution) {
		if (isNumeric(row.value) && row.count >= (top?.count ?? 0)) top = row;
	}

	return {
		voteCount: votes.length,
		average,
		distribution,
		consensus,
		suggestedEstimate: top?.value ?? null,
	};
}

function isNumeric(value: CardValue): boolean {
	return value.trim() !== '' && Number.isFinite(Number(value));
}
