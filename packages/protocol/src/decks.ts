import type { CardValue, Deck, DeckId } from './model';

/** Means "not sure". Never counts towards the average or the estimate. */
export const UNSURE_CARD: CardValue = '?';

/** Asks for a break. Never counts towards the average or the estimate. */
export const COFFEE_CARD: CardValue = 'coffee';

/**
 * The decks a room can use. Server and client share this list, so the cards the UI shows are
 * always the ones the server accepts. Values are plain strings; numeric ones count towards the
 * average, `½` is sent as `'0.5'`.
 */
export const DECKS: Record<DeckId, Deck> = {
	fibonacci: {
		id: 'fibonacci',
		name: 'Fibonacci',
		cards: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', UNSURE_CARD, COFFEE_CARD],
	},
	'modified-fibonacci': {
		id: 'modified-fibonacci',
		name: 'Modified Fibonacci',
		cards: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100', UNSURE_CARD, COFFEE_CARD],
	},
	't-shirt': {
		id: 't-shirt',
		name: 'T-shirt sizes',
		cards: ['XS', 'S', 'M', 'L', 'XL', 'XXL', UNSURE_CARD, COFFEE_CARD],
	},
};
