import type { CardValue } from '@flipvote/protocol';
import { fail, ok, type Room, type RoomResult } from '../room';

/** Casts or changes a vote; `null` withdraws it. Only non-spectators, only while voting. */
export function vote(room: Room, participantId: string, value: CardValue | null): RoomResult {
	const participant = room.participants.get(participantId);
	if (!participant) return fail('NOT_JOINED');
	if (participant.isSpectator) return fail('SPECTATOR_CANNOT_VOTE');
	if (room.phase !== 'voting') return fail('ALREADY_REVEALED');
	if (value !== null && !room.deck.cards.includes(value)) return fail('INVALID_CARD');

	const votes = new Map(room.votes);
	if (value === null) votes.delete(participantId);
	else votes.set(participantId, value);
	return ok({ ...room, votes });
}
