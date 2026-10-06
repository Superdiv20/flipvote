import { fail, ok, type Room, type RoomResult } from '../room';

/** Facilitator only. Turns flipping by itself on or off. Turning it off ends a running countdown. */
export function setAutoFlip(room: Room, participantId: string, enabled: boolean): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	return ok({ ...room, autoFlip: enabled, countingDown: enabled && room.countingDown });
}

/**
 * Whether the countdown should start: the auto flip is on, the round is open, no countdown runs
 * yet, and everyone who can vote has voted. Spectators can't vote, and someone who is away can't
 * be waited for, so neither holds the round up.
 */
export function readyToAutoFlip(room: Room): boolean {
	if (!room.autoFlip || room.phase !== 'voting' || room.countingDown) return false;
	const voters = [...room.participants.values()].filter((p) => !p.isSpectator && p.connected);
	return voters.length > 0 && voters.every((p) => room.votes.has(p.id));
}

/** Starts the countdown: from here on, votes are locked until the cards are revealed. */
export function startCountdown(room: Room): Room {
	return { ...room, countingDown: true };
}
