import { DECKS, type DeckId } from '@flipvote/protocol';

/** For untrusted input such as a request body or a socket frame. `hasOwn`, so `__proto__` or `toString` don't count. */
export function isDeckId(value: unknown): value is DeckId {
	return typeof value === 'string' && Object.hasOwn(DECKS, value);
}
