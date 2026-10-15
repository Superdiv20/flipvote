import { COFFEE_CARD, DECKS, type DeckId, UNSURE_CARD } from '@flipvote/protocol';
import { marker } from '@jsverse/transloco-keys-manager/marker';

/**
 * The deck names in the client's languages. The protocol's `DECKS` keep their English `name` for
 * the server and logs; the UI shows these. A `Record`, so a new deck needs its key here.
 */
const DECK_NAME_KEYS: Record<DeckId, string> = {
  fibonacci: marker('decks.fibonacci'),
  'modified-fibonacci': marker('decks.modified-fibonacci'),
  't-shirt': marker('decks.t-shirt'),
};

/** Every deck with the cards to preview it by: the estimates, without `?` and coffee, which every deck has. */
export const DECK_OPTIONS = Object.values(DECKS).map((deck) => ({
  id: deck.id,
  nameKey: DECK_NAME_KEYS[deck.id],
  preview: deck.cards.filter((card) => card !== UNSURE_CARD && card !== COFFEE_CARD),
}));
