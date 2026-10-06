import { describe, expect, test } from 'bun:test';
import type { ServerMessage } from '@flipvote/protocol';
import { registry } from '../../room/room-registry';
import { handleIntent } from '../../ws/handle-intent';
import { handleJoin } from '../../ws/handle-join';
import { ERROR_MESSAGES } from '../../shared/error-messages';
import { fakeServer, joinMessage, newRoom, type Outgoing, TEST_AUTO_FLIP_MS } from './fake-server';

type State = Extract<ServerMessage, { type: 'state' }>['room'];

/** Ana (facilitator), Ben and Cy, with the auto flip on. The log starts empty. */
function seated({ autoFlip = true } = {}) {
	const room = newRoom();
	const h = fakeServer();
	const [ana, ben, cy] = [h.socket(), h.socket(), h.socket()];
	handleJoin(ana.ws, joinMessage(room.id, 'Ana', 'token-creator'), h.states, h.presence);
	handleJoin(ben.ws, joinMessage(room.id, 'Ben', 'token-ben'), h.states, h.presence);
	handleJoin(cy.ws, joinMessage(room.id, 'Cy', 'token-cy'), h.states, h.presence);
	if (autoFlip) handleIntent(ana.ws, { type: 'setAutoFlip', enabled: true }, h.server, h.states);
	h.log.length = 0;

	const act = (ws: typeof ana.ws, msg: Parameters<typeof handleIntent>[1]) =>
		handleIntent(ws, msg, h.server, h.states);
	const voteAll = (value = '5') => {
		for (const s of [ana, ben, cy]) act(s.ws, { type: 'vote', value });
	};
	const lastState = (): State => {
		const entry = h.log.findLast((e) => e.to === 'topic' && e.message.type === 'state');
		if (!entry || entry.message.type !== 'state') throw new Error('Nothing was published');
		return entry.message.room;
	};
	const statesPublished = () => h.log.filter((e) => e.message.type === 'state').length;

	return { ...h, roomId: room.id, ana, ben, cy, act, voteAll, lastState, statesPublished };
}

const error = (code: keyof typeof ERROR_MESSAGES): Outgoing => ({
	to: 'socket',
	message: { type: 'error', code, message: ERROR_MESSAGES[code] },
});

describe('auto flip countdown', () => {
	test('starts when the last person votes and tells everyone how long it runs', () => {
		const { voteAll, lastState } = seated();
		voteAll();
		expect(lastState().flipInMs).toBe(TEST_AUTO_FLIP_MS);
		expect(lastState().phase).toBe('voting');
	});

	test('flips the cards when it runs out', () => {
		const { clock, roomId, voteAll, lastState } = seated();
		voteAll();
		clock.advance(TEST_AUTO_FLIP_MS);

		expect(lastState().phase).toBe('revealed');
		expect(lastState().flipInMs).toBeNull();
		expect(lastState().result?.voteCount).toBe(3);
		expect(registry.getRoom(roomId)!.phase).toBe('revealed');
	});

	test('does not start while someone still has to vote', () => {
		const { act, ana, ben, clock, lastState } = seated();
		act(ana.ws, { type: 'vote', value: '5' });
		act(ben.ws, { type: 'vote', value: '5' });
		expect(lastState().flipInMs).toBeNull();
		clock.advance(TEST_AUTO_FLIP_MS * 2);
		expect(lastState().phase).toBe('voting');
	});

	test('does not start when the auto flip is off', () => {
		const { voteAll, clock, lastState } = seated({ autoFlip: false });
		voteAll();
		expect(lastState().flipInMs).toBeNull();
		clock.advance(TEST_AUTO_FLIP_MS * 2);
		expect(lastState().phase).toBe('voting');
	});

	test('reports the time that is left with every state in between', () => {
		const { act, ben, clock, voteAll, lastState } = seated();
		voteAll();
		clock.advance(100);
		act(ben.ws, { type: 'setName', name: 'Ben K' });
		expect(lastState().flipInMs).toBe(TEST_AUTO_FLIP_MS - 100);
	});



	describe('locks the votes', () => {
		test('a changed vote is rejected and the countdown runs on', () => {
			const { act, cy, clock, voteAll, log, lastState, roomId } = seated();
			voteAll('5');
			log.length = 0;
			act(cy.ws, { type: 'vote', value: '8' });

			expect(log).toEqual([error('VOTES_LOCKED')]);
			clock.advance(TEST_AUTO_FLIP_MS);
			expect(lastState().phase).toBe('revealed');
			expect(registry.getRoom(roomId)!.votes.get(cy.ws.data.participantId!)).toBe('5');
		});

		test('a withdrawn vote is rejected', () => {
			const { act, cy, voteAll, log } = seated();
			voteAll();
			log.length = 0;
			act(cy.ws, { type: 'vote', value: null });
			expect(log).toEqual([error('VOTES_LOCKED')]);
		});

		test('switching to watch only is rejected, since it would drop the vote', () => {
			const { act, cy, voteAll, log } = seated();
			voteAll();
			log.length = 0;
			act(cy.ws, { type: 'setSpectator', spectator: true });
			expect(log).toEqual([error('VOTES_LOCKED')]);
		});

		test('someone joining during the countdown does not stop it', () => {
			const { states, presence, socket, roomId, clock, voteAll, lastState } = seated();
			voteAll();
			handleJoin(socket().ws, joinMessage(roomId, 'Dan', 'token-dan'), states, presence);
			expect(lastState().flipInMs).toBe(TEST_AUTO_FLIP_MS);
			clock.advance(TEST_AUTO_FLIP_MS);
			expect(lastState().phase).toBe('revealed');
		});
	});

	test('turning the auto flip off unlocks the votes again', () => {
		const { act, ana, cy, voteAll, log } = seated();
		voteAll();
		act(ana.ws, { type: 'setAutoFlip', enabled: false });
		log.length = 0;
		act(cy.ws, { type: 'vote', value: '8' });
		expect(log.some((e) => e.message.type === 'error')).toBe(false);
	});

	test('stops when the facilitator turns the auto flip off', () => {
		const { act, ana, clock, voteAll, lastState } = seated();
		voteAll();
		act(ana.ws, { type: 'setAutoFlip', enabled: false });

		expect(lastState().autoFlip).toBe(false);
		expect(lastState().flipInMs).toBeNull();
		clock.advance(TEST_AUTO_FLIP_MS * 2);
		expect(lastState().phase).toBe('voting');
	});


	test('starts once the last one left to vote goes away', () => {
		const { act, ana, ben, cy, lastState } = seated();
		act(ana.ws, { type: 'vote', value: '5' });
		act(ben.ws, { type: 'vote', value: '5' });
		cy.close();
		expect(lastState().flipInMs).toBe(TEST_AUTO_FLIP_MS);
	});

	test('a manual flip during the countdown ends it, without a second flip', () => {
		const { act, ana, clock, voteAll, statesPublished } = seated();
		voteAll();
		act(ana.ws, { type: 'flip' });
		const afterFlip = statesPublished();

		clock.advance(TEST_AUTO_FLIP_MS * 2);
		expect(statesPublished()).toBe(afterFlip);
		expect(clock.pending()).toBe(0);
	});

	test('a new round starts without a countdown', () => {
		const { act, ana, clock, voteAll, lastState } = seated();
		voteAll();
		clock.advance(TEST_AUTO_FLIP_MS);
		act(ana.ws, { type: 'reset' });
		expect(lastState().phase).toBe('voting');
		expect(lastState().flipInMs).toBeNull();
	});
});
