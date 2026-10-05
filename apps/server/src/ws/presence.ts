import { leave } from '../room/participants/leave';
import { setConnected } from '../room/participants/set-connected';
import { registry } from '../room/room-registry';
import { toSharedState } from '../room/to-shared-state';
import { publish, type Publisher } from './send';
import { seatTopic } from './topics';

/** Runs `task` after `ms` and returns a function that calls it off. Injected so tests control time. */
export type Schedule = (task: () => void, ms: number) => () => void;

/** How long a seat waits for its owner to come back, e.g. after a refresh or a dropped network. */
export const SEAT_GRACE_MS = 30_000;

const realTimers: Schedule = (task, ms) => {
	const timer = setTimeout(task, ms);
	return () => clearTimeout(timer);
};

/**
 * Keeps seats while their owner is away. When the last tab of a seat closes, the seat shows as
 * disconnected; if nobody comes back within the grace period, the participant leaves (handing the
 * facilitator role on), and a room left without anyone is removed.
 */
export function createPresence(server: Publisher, schedule: Schedule = realTimers, graceMs = SEAT_GRACE_MS) {
	/** Seat topic → call off the pending removal. */
	const pendingRemovals = new Map<string, () => void>();

	function callOffRemoval(key: string): void {
		pendingRemovals.get(key)?.();
		pendingRemovals.delete(key);
	}

	function removeSeat(roomId: string, participantId: string): void {
		const room = registry.getRoom(roomId);
		// Back in time, or already gone: nothing to do.
		if (room?.participants.get(participantId)?.connected !== false) return;

		const result = leave(room, participantId);
		if (!result.ok) return;
		if (result.room.participants.size === 0) {
			registry.removeRoom(roomId);
			return;
		}
		registry.updateRoom(result.room);
		publish(server, roomId, { type: 'state', room: toSharedState(result.room) });
	}

	return {
		/** A socket took the seat, so a pending removal is called off. */
		seated(roomId: string, participantId: string): void {
			callOffRemoval(seatTopic(roomId, participantId));
		},

		/** The seat's last open socket closed: show it as away and start the grace period. */
		lastSocketClosed(roomId: string, participantId: string): void {
			const room = registry.getRoom(roomId);
			if (!room) return;
			const result = setConnected(room, participantId, false);
			if (!result.ok) return;

			registry.updateRoom(result.room);
			publish(server, roomId, { type: 'state', room: toSharedState(result.room) });

			const key = seatTopic(roomId, participantId);
			callOffRemoval(key);
			pendingRemovals.set(
				key,
				schedule(() => {
					pendingRemovals.delete(key);
					removeSeat(roomId, participantId);
				}, graceMs),
			);
		},
	};
}

export type Presence = ReturnType<typeof createPresence>;
