import { type DeckId, DECKS } from '@flipvote/protocol';
import { fail, newRound, ok, type Room, type RoomResult } from '../room';

/** Facilitator only. Switches the deck and starts a new round, since old votes may not exist in it. */
export function changeDeck(room: Room, participantId: string, deckId: DeckId): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	const deck = DECKS[deckId];
	if (!deck) return fail('INVALID_MESSAGE');
	if (deck.id === room.deck.id) return ok(room);

	return ok(newRound({ ...room, deck }));
}
