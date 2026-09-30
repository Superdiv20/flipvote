import { calculateResult } from './calculate-result';
import { fail, ok, type Room, type RoomResult } from '../room';

/** Facilitator only. Reveals the cards and stores the result, calculated once. */
export function flip(room: Room, participantId: string): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	if (room.phase !== 'voting') return fail('ALREADY_REVEALED');
	if (room.votes.size === 0) return fail('NO_VOTES');

	return ok({ ...room, phase: 'revealed', result: calculateResult([...room.votes.values()], room.deck) });
}
