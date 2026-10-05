import { type ClientMessage, DECKS, type ServerMessage } from '@flipvote/protocol';
import { registry } from '../room/room-registry';
import { handleClose } from './handle-close';
import { createPresence, type Schedule } from './presence';
import type { SocketData } from './socket-data';

/** Everything that left the server, in order: `send` to one socket, or `publish` to a topic. */
export type Outgoing =
	| { to: 'socket'; message: ServerMessage }
	| { to: 'topic'; topic: string; message: ServerMessage };

/** The grace period the harness's presence uses. Only `clock.advance` lets it pass. */
export const TEST_GRACE_MS = 1000;

/** A clock that only moves when the test says so. */
export function manualClock() {
	let now = 0;
	const tasks: { at: number; run: () => void; cancelled: boolean }[] = [];

	const schedule: Schedule = (run, ms) => {
		const task = { at: now + ms, run, cancelled: false };
		tasks.push(task);
		return () => {
			task.cancelled = true;
		};
	};

	return {
		schedule,
		/** How many tasks are still waiting to run. */
		pending(): number {
			return tasks.filter((t) => !t.cancelled).length;
		},
		/** Moves time forward and runs every task that is due and not called off. */
		advance(ms: number): void {
			now += ms;
			for (const task of tasks.filter((t) => t.at <= now && !t.cancelled)) {
				task.cancelled = true;
				task.run();
			}
		},
	};
}

/**
 * A fake server and fake sockets for the socket handlers. Every `send` and `publish` lands in one
 * shared `log`, so tests can check the order as well as the content. Subscriptions are tracked,
 * so `subscriberCount` and `close` behave like Bun's.
 */
export function harness() {
	const log: Outgoing[] = [];
	const subscribers = new Map<string, Set<object>>();
	const server = {
		publish(topic: string, data: unknown) {
			log.push({ to: 'topic', topic, message: JSON.parse(String(data)) });
			return 0;
		},
		subscriberCount(topic: string) {
			return subscribers.get(topic)?.size ?? 0;
		},
	};
	const clock = manualClock();
	const presence = createPresence(server, clock.schedule, TEST_GRACE_MS);

	function socket(data: SocketData = { roomId: null, participantId: null }) {
		const topics: string[] = [];
		const ws = {
			data,
			send(raw: unknown) {
				log.push({ to: 'socket', message: JSON.parse(String(raw)) });
				return 0;
			},
			subscribe(topic: string) {
				topics.push(topic);
				if (!subscribers.has(topic)) subscribers.set(topic, new Set());
				subscribers.get(topic)!.add(ws);
				return true;
			},
		};
		/** Closes like Bun: unsubscribed from every topic first, then the close handler runs. */
		function close(): void {
			for (const topic of topics) subscribers.get(topic)?.delete(ws);
			handleClose(ws, server, presence);
		}
		return { ws, topics, close };
	}

	return { log, server, presence, clock, socket };
}

/** A fresh room in the registry. Each test makes its own, so tests don't share state. */
export function newRoom() {
	return registry.addRoom('Sprint 42', DECKS.fibonacci, 'token-creator');
}

export function joinMessage(
	roomId: string,
	name: string,
	sessionToken: string,
): Extract<ClientMessage, { type: 'join' }> {
	return { type: 'join', roomId, name, sessionToken };
}
