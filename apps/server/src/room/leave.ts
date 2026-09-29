import { fail, ok, type Room, type RoomResult } from './room';

/**
 * Removes the participant and their vote. If they were the facilitator, the role passes to the
 * next participant in join order (wrapping around), or to nobody when the room is now empty.
 * A result stored at the flip stays as it is.
 */
export function leave(room: Room, participantId: string): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');

	const order = [...room.participants.keys()];
	const participants = new Map(room.participants);
	participants.delete(participantId);
	const votes = new Map(room.votes);
	votes.delete(participantId);

	let facilitatorId = room.facilitatorId;
	if (facilitatorId === participantId) {
		const index = order.indexOf(participantId);
		const successors = [...order.slice(index + 1), ...order.slice(0, index)];
		facilitatorId = successors[0] ?? null;
	}

	return ok({ ...room, participants, votes, facilitatorId });
}
