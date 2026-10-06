import { fail, ok, type Room, type RoomResult } from '../room';
import { displayName } from '../../shared/display-name';

/**
 * Seats a new participant, or rejoins an existing one (same id) in the same seat with their vote
 * kept. The room's creator becomes the facilitator when they take their seat, even if someone
 * joined first. Until then, the first participant holds the role.
 *
 * The caller resolves the id with `participantIdForToken`, or makes a new one for a new token.
 * A rejoin with a token that doesn't own the seat is rejected, so a public id alone can't take it over.
 */
export function join(room: Room, participantId: string, name: string, sessionToken: string): RoomResult {
	const checked = displayName(name);
	if (!checked.ok) return fail(checked.code);
	const trimmed = checked.name;

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

	// Only a new seat claims the role, so a creator who handed it over doesn't take it back on a refresh.
	const isCreator = !existing && sessionToken === room.creatorToken;
	const facilitatorId = isCreator ? participantId : (room.facilitatorId ?? participantId);

	return ok({ ...room, participants, facilitatorId });
}

/** The seat a token owns in this room, if any. */
export function participantIdForToken(room: Room, sessionToken: string): string | undefined {
	for (const participant of room.participants.values()) {
		if (participant.sessionToken === sessionToken) return participant.id;
	}
	return undefined;
}
