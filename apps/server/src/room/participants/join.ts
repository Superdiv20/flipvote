import { fail, ok, type Room, type RoomResult } from '../room';

/**
 * Seats a new participant, or rejoins an existing one (same id) in the same seat with their vote
 * kept. The first participant in an empty room becomes the facilitator.
 *
 * The caller resolves the id with `participantIdForToken`, or makes a new one for a new token.
 * A rejoin with a token that doesn't own the seat is rejected, so a public id alone can't take it over.
 */
export function join(room: Room, participantId: string, name: string, sessionToken: string): RoomResult {
	const trimmed = name.trim();
	if (!trimmed) return fail('NAME_REQUIRED');

	const existing = room.participants.get(participantId);
	if (existing && existing.sessionToken !== sessionToken) return fail('INVALID_SESSION');

	const participants = new Map(room.participants);
	// Map.set on an existing key keeps its position, so a rejoin keeps the seat.
	participants.set(
		participantId,
		existing
			? { ...existing, name: trimmed, connected: true }
			: { id: participantId, sessionToken, name: trimmed, isSpectator: false, connected: true },
	);

	return ok({ ...room, participants, facilitatorId: room.facilitatorId ?? participantId });
}

/** The seat a token owns in this room, if any. */
export function participantIdForToken(room: Room, sessionToken: string): string | undefined {
	for (const participant of room.participants.values()) {
		if (participant.sessionToken === sessionToken) return participant.id;
	}
	return undefined;
}
