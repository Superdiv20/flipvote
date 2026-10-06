import { readyToAutoFlip, startCountdown } from '../room/round/auto-flip';
import { reveal } from '../room/round/flip';
import type { Room } from '../room/room';
import { registry } from '../room/room-registry';
import { toSharedState } from '../room/to-shared-state';
import { publish, type Publisher } from './send';
import { realTimers, type Schedule } from './timers';

/** How long everyone sees the countdown before the cards flip by themselves. */
export const AUTO_FLIP_DELAY_MS = 3000;

/**
 * The one place that publishes a room's state. On the way it starts the auto flip's countdown
 * once everyone has voted, and ends it when the room says it no longer runs (flipped by hand, a
 * new round, or the auto flip turned off).
 */
export function createStatePublisher(
	server: Publisher,
	schedule: Schedule = realTimers,
	now: () => number = Date.now,
	delayMs = AUTO_FLIP_DELAY_MS,
) {
	const countdowns = new Map<string, { endsAt: number; cancel: () => void }>();

	function flipNow(roomId: string): void {
		const room = registry.getRoom(roomId);
		if (!room?.countingDown) return;
		const result = reveal(room);
		if (!result.ok) return;
		registry.updateRoom(result.room);
		publishState(result.room);
	}

	function publishState(room: Room): void {
		let current = room;
		if (readyToAutoFlip(room)) {
			current = registry.updateRoom(startCountdown(room));
			countdowns.set(room.id, {
				endsAt: now() + delayMs,
				cancel: schedule(() => {
					countdowns.delete(room.id);
					flipNow(room.id);
				}, delayMs),
			});
		}

		const countdown = countdowns.get(room.id);
		if (countdown && !current.countingDown) {
			countdown.cancel();
			countdowns.delete(room.id);
		}

		const flipInMs = current.countingDown && countdown ? Math.max(0, countdown.endsAt - now()) : null;
		publish(server, room.id, { type: 'state', room: toSharedState(current, flipInMs) });
	}

	return { publishState };
}

export type StatePublisher = ReturnType<typeof createStatePublisher>;
