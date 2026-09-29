import { fail, ok, type Room, type RoomResult } from './room';

/** Marks a participant as connected or as in their reconnect grace period. */
export function setConnected(room: Room, participantId: string, connected: boolean): RoomResult {
	const participant = room.participants.get(participantId);
	if (!participant) return fail('NOT_JOINED');

	const participants = new Map(room.participants);
	participants.set(participantId, { ...participant, connected });
	return ok({ ...room, participants });
}
