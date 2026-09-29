import { fail, ok, type RoomResult, type Room } from './room';

/**
 * Moves the facilitator role from the current facilitator to another participant manually.
 * @param room The room in which the facilitator transfer is taking place.
 * @param participantId The ID of the current facilitator who is initiating the transfer.
 * @param targetId The ID of the participant who will become the new facilitator.
 */
export function transferFacilitator(
	room: Room,
	participantId: string,
	targetId: string,
): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	const target = room.participants.get(targetId);
	if (!target) return fail('PARTICIPANT_NOT_FOUND');
	if (!target.connected) return fail('PARTICIPANT_NOT_CONNECTED');

	return ok({ ...room, facilitatorId: targetId });
}
