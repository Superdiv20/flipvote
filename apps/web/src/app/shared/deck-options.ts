import { COFFEE_CARD, DECKS, UNSURE_CARD } from '@flipvote/protocol';

/** Every deck with the cards to preview it by: the estimates, without `?` and coffee, which every deck has. */
export const DECK_OPTIONS = Object.values(DECKS).map((deck) => ({
  id: deck.id,
  name: deck.name,
  preview: deck.cards.filter((card) => card !== UNSURE_CARD && card !== COFFEE_CARD),
}));
