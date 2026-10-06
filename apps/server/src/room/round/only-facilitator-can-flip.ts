import { fail, ok, type Room, type RoomResult } from '../room';

/**
 * Facilitator only. Whether only the facilitator may reveal the cards by hand, or everyone in the
 * room may. The auto flip isn't affected: it reveals by itself either way.
 */
export function setOnlyFacilitatorCanFlip(room: Room, participantId: string, enabled: boolean): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	return ok({ ...room, onlyFacilitatorCanFlip: enabled });
}
