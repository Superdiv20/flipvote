import { fail, ok, type Room, type RoomResult } from '../room';

/**
 * Seats a new participant, or rejoins an existing one (same id) in the same seat with their vote
 * kept. The first participant in an empty room becomes the facilitator.
 */
export function join(room: Room, participantId: string, name: string): RoomResult {
	const trimmed = name.trim();
	if (!trimmed) return fail('NAME_REQUIRED');

	const participants = new Map(room.participants);
	const existing = participants.get(participantId);
	// Map.set on an existing key keeps its position, so a rejoin keeps the seat.
	participants.set(
		participantId,
		existing
			? { ...existing, name: trimmed, connected: true }
			: { id: participantId, name: trimmed, isSpectator: false, connected: true },
	);

	return ok({ ...room, participants, facilitatorId: room.facilitatorId ?? participantId });
}
