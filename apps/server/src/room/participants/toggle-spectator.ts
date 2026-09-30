import { fail, ok, type Room, type RoomResult } from '../room';

/**
 * Makes the participant a spectator or a voter again. Takes the target state rather than flipping
 * it, so a repeated message can't toggle twice. Becoming a spectator drops the current vote.
 */
export function toggleSpectator(room: Room, participantId: string, spectator: boolean): RoomResult {
	const participant = room.participants.get(participantId);
	if (!participant) return fail('NOT_JOINED');

	const participants = new Map(room.participants);
	participants.set(participantId, { ...participant, isSpectator: spectator });
	if (!spectator || !room.votes.has(participantId)) return ok({ ...room, participants });

	const votes = new Map(room.votes);
	votes.delete(participantId);
	return ok({ ...room, participants, votes });
}
