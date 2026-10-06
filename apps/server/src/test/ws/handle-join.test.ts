import { describe, expect, test } from 'bun:test';
import type { ServerMessage } from '@flipvote/protocol';
import { registry } from '../../room/room-registry';
import { vote } from '../../room/round/vote';
import { unwrap } from '../room/test-helpers';
import { ERROR_MESSAGES } from '../../shared/error-messages';
import { handleJoin } from '../../ws/handle-join';
import { fakeServer, joinMessage, newRoom } from './fake-server';
import { seatTopic } from '../../ws/topics';

describe('handleJoin', () => {
	describe('a first join', () => {
		test('seats the creator as facilitator and remembers the seat on the connection', () => {
			const room = newRoom();
			const { server, states, presence, socket } = fakeServer();
			const { ws, topics } = socket();

			handleJoin(ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);

			const seated = registry.getRoom(room.id)!;
			const [participantId] = [...seated.participants.keys()];
			expect(seated.facilitatorId).toBe(participantId);
			expect(ws.data).toEqual({ roomId: room.id, participantId: participantId! });
			expect(topics).toEqual([room.id, seatTopic(room.id, participantId!)]);
		});

		test('sends welcome to the joiner first, then the state to the room', () => {
			const room = newRoom();
			const { log, server, states, presence, socket } = fakeServer();
			const { ws } = socket();

			handleJoin(ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);

			const participantId = ws.data.participantId!;
			expect(log).toHaveLength(2);
			expect(log[0]).toEqual({ to: 'socket', message: { type: 'welcome', participantId, myVote: null } });
			expect(log[1]).toMatchObject({ to: 'topic', topic: room.id, message: { type: 'state' } });

			const state = log[1]!.message as Extract<ServerMessage, { type: 'state' }>;
			expect(state.room.participants).toEqual([
				{ id: participantId, name: 'Ana', isSpectator: false, connected: true, hasVoted: false },
			]);
			expect(state.room.facilitatorId).toBe(participantId);
		});

		test('never publishes session tokens', () => {
			const room = newRoom();
			const { log, server, states, presence, socket } = fakeServer();

			handleJoin(socket().ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);

			const json = JSON.stringify(log);
			expect(json).not.toContain('token-creator');
		});
	});

	describe('more people', () => {
		test('a new token gets its own seat, and the room sees both', () => {
			const room = newRoom();
			const { log, server, states, presence, socket } = fakeServer();
			const ana = socket();
			const ben = socket();

			handleJoin(ana.ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);
			handleJoin(ben.ws, joinMessage(room.id, 'Ben', 'token-ben'), states, presence);

			expect(ben.ws.data.participantId).not.toBe(ana.ws.data.participantId);
			const last = log.at(-1)!;
			expect(last).toMatchObject({ to: 'topic', topic: room.id });
			const state = last.message as Extract<ServerMessage, { type: 'state' }>;
			expect(state.room.participants.map((p) => p.name)).toEqual(['Ana', 'Ben']);
			expect(state.room.facilitatorId).toBe(ana.ws.data.participantId!);
		});
	});

	describe('rejoining', () => {
		test('the same token gets the same seat on a new connection', () => {
			const room = newRoom();
			const { server, states, presence, socket } = fakeServer();
			const first = socket();
			handleJoin(first.ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);

			const afterRefresh = socket();
			handleJoin(afterRefresh.ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);

			expect(afterRefresh.ws.data.participantId).toBe(first.ws.data.participantId);
			expect(registry.getRoom(room.id)!.participants.size).toBe(1);
		});

		test('gives the vote back in welcome after a refresh while voting', () => {
			const room = newRoom();
			const { log, server, states, presence, socket } = fakeServer();
			const first = socket();
			handleJoin(first.ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);
			const participantId = first.ws.data.participantId!;
			registry.updateRoom(unwrap(vote(registry.getRoom(room.id)!, participantId, '5')));

			handleJoin(socket().ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);

			expect(log.at(-2)).toEqual({ to: 'socket', message: { type: 'welcome', participantId, myVote: '5' } });
			// The shared state still hides the value.
			const state = log.at(-1)!.message as Extract<ServerMessage, { type: 'state' }>;
			expect(state.room.participants[0]).toMatchObject({ hasVoted: true });
			expect(state.room.participants[0]).not.toHaveProperty('vote');
		});

		test('the same connection joining the same room again is a rejoin', () => {
			const room = newRoom();
			const { log, server, states, presence, socket } = fakeServer();
			const { ws } = socket();
			handleJoin(ws, joinMessage(room.id, 'Ana', 'token-creator'), states, presence);
			const participantId = ws.data.participantId;

			handleJoin(ws, joinMessage(room.id, 'Ana K', 'token-creator'), states, presence);

			expect(ws.data.participantId).toBe(participantId);
			expect(log.at(-2)).toMatchObject({ to: 'socket', message: { type: 'welcome' } });
			expect(registry.getRoom(room.id)!.participants.get(participantId!)?.name).toBe('Ana K');
		});
	});

	describe('rejections', () => {
		test('an unknown room', () => {
			const { log, server, states, presence, socket } = fakeServer();
			const { ws, topics } = socket();

			handleJoin(ws, joinMessage('no-such-room', 'Ana', 'token-ana'), states, presence);

			expect(log).toEqual([
				{ to: 'socket', message: { type: 'error', code: 'ROOM_NOT_FOUND', message: ERROR_MESSAGES.ROOM_NOT_FOUND } },
			]);
			expect(ws.data).toEqual({ roomId: null, participantId: null });
			expect(topics).toEqual([]);
		});

		test('a blank name leaves the room untouched', () => {
			const room = newRoom();
			const { log, server, states, presence, socket } = fakeServer();
			const { ws, topics } = socket();

			handleJoin(ws, joinMessage(room.id, '   ', 'token-ana'), states, presence);

			expect(log).toEqual([
				{ to: 'socket', message: { type: 'error', code: 'NAME_REQUIRED', message: ERROR_MESSAGES.NAME_REQUIRED } },
			]);
			expect(registry.getRoom(room.id)!.participants.size).toBe(0);
			expect(ws.data).toEqual({ roomId: null, participantId: null });
			expect(topics).toEqual([]);
		});

		test('a connection that already sits in another room', () => {
			const first = newRoom();
			const second = newRoom();
			const { log, server, states, presence, socket } = fakeServer();
			const { ws, topics } = socket();
			handleJoin(ws, joinMessage(first.id, 'Ana', 'token-ana'), states, presence);
			log.length = 0;

			handleJoin(ws, joinMessage(second.id, 'Ana', 'token-ana'), states, presence);

			expect(log).toEqual([
				{ to: 'socket', message: { type: 'error', code: 'ALREADY_IN_ROOM', message: ERROR_MESSAGES.ALREADY_IN_ROOM } },
			]);
			expect(ws.data.roomId).toBe(first.id);
			expect(topics).toEqual([first.id, seatTopic(first.id, ws.data.participantId!)]);
			expect(registry.getRoom(second.id)!.participants.size).toBe(0);
		});
	});
});
