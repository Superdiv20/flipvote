import { fail, ok, type Room, type RoomResult } from '../room';
import { displayName } from '../../shared/display-name';

/**
 * The sender, for themselves. Renames their seat: it keeps its place in join order, its vote,
 * its spectator mode and the facilitator role.
 */
export function setName(room: Room, participantId: string, name: string): RoomResult {
	const participant = room.participants.get(participantId);
	if (!participant) return fail('NOT_JOINED');

	const checked = displayName(name);
	if (!checked.ok) return fail(checked.code);

	const participants = new Map(room.participants);
	participants.set(participantId, { ...participant, name: checked.name });
	return ok({ ...room, participants });
}
