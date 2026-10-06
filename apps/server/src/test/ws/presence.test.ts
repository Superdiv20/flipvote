import { describe, expect, test } from 'bun:test';
import type { ServerMessage } from '@flipvote/protocol';
import { registry } from '../../room/room-registry';
import { handleIntent } from '../../ws/handle-intent';
import { handleJoin } from '../../ws/handle-join';
import { fakeServer, joinMessage, newRoom, TEST_GRACE_MS } from './fake-server';
import { seatTopic } from '../../ws/topics';

type State = Extract<ServerMessage, { type: 'state' }>['room'];

/** Ana (the creator, so facilitator) and Ben, each with one tab. The log starts empty. */
function seated() {
	const room = newRoom();
	const h = fakeServer();
	const ana = h.socket();
	const ben = h.socket();
	handleJoin(ana.ws, joinMessage(room.id, 'Ana', 'token-creator'), h.server, h.presence);
	handleJoin(ben.ws, joinMessage(room.id, 'Ben', 'token-ben'), h.server, h.presence);
	h.log.length = 0;
	return { ...h, roomId: room.id, ana, ben };
}

function lastState(log: ReturnType<typeof fakeServer>['log']): State {
	const entry = log.findLast((e) => e.to === 'topic' && e.message.type === 'state');
	if (!entry || entry.message.type !== 'state') throw new Error('Nothing was published');
	return entry.message.room;
}

const seatOf = (state: State, name: string) => state.participants.find((p) => p.name === name);

describe('presence', () => {
	describe('closing a tab', () => {
		test('the last tab of a seat shows it as away to the others', () => {
			const { log, roomId, ben } = seated();
			ben.close();

			expect(log).toHaveLength(1);
			expect(log[0]).toMatchObject({ to: 'topic', topic: roomId });
			expect(seatOf(lastState(log), 'Ben')).toMatchObject({ connected: false });
			expect(registry.getRoom(roomId)!.participants.size).toBe(2);
		});

		test('another open tab of the same seat keeps it connected', () => {
			const { log, server, presence, socket, roomId, ben } = seated();
			const secondTab = socket();
			handleJoin(secondTab.ws, joinMessage(roomId, 'Ben', 'token-ben'), server, presence);
			log.length = 0;

			ben.close();

			expect(log).toEqual([]);
			expect(registry.getRoom(roomId)!.participants.get(ben.ws.data.participantId!)?.connected).toBe(true);
		});

		test('a socket that never joined changes nothing', () => {
			const { log, socket } = seated();
			socket().close();
			expect(log).toEqual([]);
		});
	});

	describe('the grace period', () => {
		test('keeps the seat and the vote until it runs out', () => {
			const { log, server, clock, roomId, ben } = seated();
			handleIntent(ben.ws, { type: 'vote', value: '5' }, server);
			ben.close();
			log.length = 0;

			clock.advance(TEST_GRACE_MS - 1);

			expect(log).toEqual([]);
			expect(registry.getRoom(roomId)!.votes.size).toBe(1);
		});

		test('removes the seat and its vote once it runs out', () => {
			const { log, server, clock, roomId, ben } = seated();
			handleIntent(ben.ws, { type: 'vote', value: '5' }, server);
			ben.close();

			clock.advance(TEST_GRACE_MS);

			expect(lastState(log).participants.map((p) => p.name)).toEqual(['Ana']);
			expect(registry.getRoom(roomId)!.votes.size).toBe(0);
		});

		test('hands the facilitator role on when the facilitator does not come back', () => {
			const { log, clock, ana, ben } = seated();
			ana.close();
			clock.advance(TEST_GRACE_MS);
			expect(lastState(log).facilitatorId).toBe(ben.ws.data.participantId!);
		});

		test('coming back in time keeps the seat, the vote and the role', () => {
			const { log, server, presence, socket, clock, roomId, ana } = seated();
			handleIntent(ana.ws, { type: 'vote', value: '3' }, server);
			const participantId = ana.ws.data.participantId!;
			ana.close();

			const afterRefresh = socket();
			handleJoin(afterRefresh.ws, joinMessage(roomId, 'Ana', 'token-creator'), server, presence);
			clock.advance(TEST_GRACE_MS * 2);

			const room = registry.getRoom(roomId)!;
			expect(room.participants.get(participantId)).toMatchObject({ connected: true });
			expect(room.votes.get(participantId)).toBe('3');
			expect(room.facilitatorId).toBe(participantId);
			expect(seatOf(lastState(log), 'Ana')).toMatchObject({ connected: true });
		});

		test('coming back calls off the pending removal right away', () => {
			const { server, presence, socket, clock, roomId, ben } = seated();
			ben.close();
			expect(clock.pending()).toBe(1);

			handleJoin(socket().ws, joinMessage(roomId, 'Ben', 'token-ben'), server, presence);

			expect(clock.pending()).toBe(0);
		});

		test('leaving again after coming back starts a fresh grace period', () => {
			const { server, presence, socket, clock, roomId, ben } = seated();
			ben.close();
			clock.advance(TEST_GRACE_MS / 2);

			const back = socket();
			handleJoin(back.ws, joinMessage(roomId, 'Ben', 'token-ben'), server, presence);
			back.close();
			clock.advance(TEST_GRACE_MS / 2);

			// Half of the first period plus half of the second: not enough for either.
			expect(registry.getRoom(roomId)!.participants.size).toBe(2);
			clock.advance(TEST_GRACE_MS / 2);
			expect(registry.getRoom(roomId)!.participants.size).toBe(1);
		});
	});

	describe('an empty room', () => {
		test('is removed when its last participant’s grace period runs out', () => {
			const { log, clock, roomId, ana, ben } = seated();
			ana.close();
			ben.close();
			log.length = 0;

			clock.advance(TEST_GRACE_MS);

			expect(registry.getRoom(roomId)).toBeUndefined();
			// Nobody is left to tell, and an empty room has no state to send.
			expect(log.filter((e) => e.message.type === 'state')).toHaveLength(1);
		});

		test('is kept while someone is still away within the grace period', () => {
			const { clock, roomId, ana, ben } = seated();
			ana.close();
			clock.advance(TEST_GRACE_MS / 2);
			ben.close();
			clock.advance(TEST_GRACE_MS / 2);

			expect(registry.getRoom(roomId)!.participants.size).toBe(1);
			clock.advance(TEST_GRACE_MS / 2);
			expect(registry.getRoom(roomId)).toBeUndefined();
		});
	});

	test('myVote reaches every tab of the voter’s seat', () => {
		const { log, server, presence, socket, roomId, ben } = seated();
		const secondTab = socket();
		handleJoin(secondTab.ws, joinMessage(roomId, 'Ben', 'token-ben'), server, presence);
		log.length = 0;

		handleIntent(ben.ws, { type: 'vote', value: '8' }, server);

		const seat = seatTopic(roomId, ben.ws.data.participantId!);
		expect(log[0]).toEqual({ to: 'topic', topic: seat, message: { type: 'myVote', value: '8' } });
		expect(secondTab.topics).toContain(seat);
	});
});
