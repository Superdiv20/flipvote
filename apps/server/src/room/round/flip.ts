import { calculateResult } from './calculate-result';
import { fail, ok, type Room, type RoomResult } from '../room';

/** Facilitator only. Reveals the cards and stores the result, calculated once. */
export function flip(room: Room, participantId: string): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	return reveal(room);
}

/**
 * Reveals the cards without asking who wants it: the facilitator's `flip`, and the auto flip when
 * its countdown runs out, both end here.
 */
export function reveal(room: Room): RoomResult {
	if (room.phase !== 'voting') return fail('ALREADY_REVEALED');
	if (room.votes.size === 0) return fail('NO_VOTES');

	const result = calculateResult([...room.votes.values()], room.deck);
	return ok({ ...room, phase: 'revealed', result, countingDown: false });
}
