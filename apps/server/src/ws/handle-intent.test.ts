import { describe, expect, test } from 'bun:test';
import { DECKS, type ErrorCode, type ServerMessage } from '@flipvote/protocol';
import { registry } from '../room/room-registry';
import { ERROR_MESSAGES } from '../shared/error-messages';
import { handleIntent } from './handle-intent';
import { handleJoin } from './handle-join';
import { harness, joinMessage, newRoom, type Outgoing } from './testing';
import { seatTopic } from './topics';

type State = Extract<ServerMessage, { type: 'state' }>['room'];

/** Ana (the creator, so facilitator) and Ben, seated through the real join. The log starts empty. */
function seated() {
	const room = newRoom();
	const h = harness();
	const ana = h.socket();
	const ben = h.socket();
	handleJoin(ana.ws, joinMessage(room.id, 'Ana', 'token-creator'), h.server, h.presence);
	handleJoin(ben.ws, joinMessage(room.id, 'Ben', 'token-ben'), h.server, h.presence);
	h.log.length = 0;
	return { ...h, roomId: room.id, ana: ana.ws, ben: ben.ws };
}

/** The state of the last publish. */
function lastState(log: ReturnType<typeof harness>['log']): State {
	const entry = log.findLast((e) => e.to === 'topic');
	if (!entry || entry.message.type !== 'state') throw new Error('Nothing was published');
	return entry.message.room;
}

const error = (code: ErrorCode): Outgoing => ({
	to: 'socket',
	message: { type: 'error', code, message: ERROR_MESSAGES[code] },
});

describe('handleIntent', () => {
	describe('before the rule runs', () => {
		test('rejects a socket that has not joined', () => {
			const { log, server, socket } = harness();
			handleIntent(socket().ws, { type: 'flip' }, server);
			expect(log).toEqual([error('NOT_JOINED')]);
		});

		test('rejects a socket whose room is gone', () => {
			const { log, server, socket } = harness();
			const { ws } = socket({ roomId: 'gone', participantId: 'ana' });
			handleIntent(ws, { type: 'flip' }, server);
			expect(log).toEqual([error('ROOM_NOT_FOUND')]);
		});
	});

	describe('when the rule fails', () => {
		test('answers only the sender with the rule’s code and changes nothing', () => {
			const { log, server, roomId, ben } = seated();
			const before = registry.getRoom(roomId);

			handleIntent(ben, { type: 'flip' }, server);

			expect(log).toEqual([error('NOT_FACILITATOR')]);
			expect(registry.getRoom(roomId)).toBe(before);
		});

		test.each([
			['a card outside the deck', { type: 'vote', value: '999' }, 'INVALID_CARD'],
			['a flip without votes', { type: 'flip' }, 'NO_VOTES'],
			['an unknown issue', { type: 'selectIssue', issueId: 'nope' }, 'ISSUE_NOT_FOUND'],
			['a blank title', { type: 'addIssue', issue: { title: '  ' } }, 'TITLE_REQUIRED'],
		] as const)('passes the code through for %s', (_, msg, code) => {
			const { log, server, ana } = seated();
			handleIntent(ana, msg, server);
			expect(log).toEqual([error(code)]);
		});
	});

	describe('voting', () => {
		test('tells only the voter’s seat the value, then publishes that they voted', () => {
			const { log, server, roomId, ben } = seated();

			handleIntent(ben, { type: 'vote', value: '5' }, server);

			expect(log).toHaveLength(2);
			expect(log[0]).toEqual({
				to: 'topic',
				topic: seatTopic(roomId, ben.data.participantId!),
				message: { type: 'myVote', value: '5' },
			});
			expect(log[1]).toMatchObject({ to: 'topic', topic: roomId });
			const benSeat = lastState(log).participants.find((p) => p.name === 'Ben');
			expect(benSeat).toMatchObject({ hasVoted: true });
			expect(benSeat).not.toHaveProperty('vote');
		});

		test('withdrawing sends null as the own vote', () => {
			const { log, server, roomId, ben } = seated();
			handleIntent(ben, { type: 'vote', value: '5' }, server);
			handleIntent(ben, { type: 'vote', value: null }, server);
			expect(log.at(-2)).toEqual({
				to: 'topic',
				topic: seatTopic(roomId, ben.data.participantId!),
				message: { type: 'myVote', value: null },
			});
			expect(lastState(log).participants.find((p) => p.name === 'Ben')?.hasVoted).toBe(false);
		});

		test('stores the vote in the registry', () => {
			const { server, roomId, ben } = seated();
			handleIntent(ben, { type: 'vote', value: '8' }, server);
			expect([...registry.getRoom(roomId)!.votes.values()]).toEqual(['8']);
		});
	});

	describe('everything else only publishes the state', () => {
		test('flip reveals every vote', () => {
			const { log, server, ana, ben } = seated();
			handleIntent(ana, { type: 'vote', value: '3' }, server);
			handleIntent(ben, { type: 'vote', value: '5' }, server);
			log.length = 0;

			handleIntent(ana, { type: 'flip' }, server);

			expect(log).toHaveLength(1);
			const state = lastState(log);
			expect(state.phase).toBe('revealed');
			expect(state.participants.map((p) => p.vote)).toEqual(['3', '5']);
			expect(state.result).toMatchObject({ voteCount: 2, average: 4 });
		});

		test('reset starts a new round', () => {
			const { log, server, ana } = seated();
			handleIntent(ana, { type: 'vote', value: '3' }, server);
			handleIntent(ana, { type: 'flip' }, server);
			handleIntent(ana, { type: 'reset' }, server);
			const state = lastState(log);
			expect(state.phase).toBe('voting');
			expect(state.participants.every((p) => !p.hasVoted)).toBe(true);
		});

		test('addIssue gives each new issue its own id', () => {
			const { log, server, ben } = seated();
			handleIntent(ben, { type: 'addIssue', issue: { key: 'ATL-1', title: 'Export' } }, server);
			handleIntent(ben, { type: 'addIssue', issue: { title: 'Import' } }, server);
			const [first, second] = lastState(log).issues;
			expect(first).toMatchObject({ key: 'ATL-1', title: 'Export' });
			expect(second).toMatchObject({ title: 'Import' });
			expect(first!.id).not.toBe('');
			expect(first!.id).not.toBe(second!.id);
		});

		test('updateIssue, selectIssue and removeIssue work on the issue id', () => {
			const { log, server, ana } = seated();
			handleIntent(ana, { type: 'addIssue', issue: { title: 'First' } }, server);
			handleIntent(ana, { type: 'addIssue', issue: { title: 'Second' } }, server);
			const [first, second] = lastState(log).issues.map((issue) => issue.id);

			handleIntent(ana, { type: 'updateIssue', issueId: second!, changes: { title: 'Renamed' } }, server);
			expect(lastState(log).issues[1]?.title).toBe('Renamed');

			handleIntent(ana, { type: 'selectIssue', issueId: second! }, server);
			expect(lastState(log).currentIssueId).toBe(second);

			handleIntent(ana, { type: 'removeIssue', issueId: first! }, server);
			expect(lastState(log).issues.map((issue) => issue.id)).toEqual([second]);
		});

		test('setDeck switches the deck', () => {
			const { log, server, ana } = seated();
			handleIntent(ana, { type: 'setDeck', deckId: 't-shirt' }, server);
			expect(lastState(log).deck).toEqual(DECKS['t-shirt']);
		});

		test('setSpectator changes the sender’s own seat', () => {
			const { log, server, ben } = seated();
			handleIntent(ben, { type: 'setSpectator', spectator: true }, server);
			expect(lastState(log).participants.find((p) => p.name === 'Ben')?.isSpectator).toBe(true);
		});

		test('transferFacilitator hands the role over', () => {
			const { log, server, ana, ben } = seated();
			handleIntent(ana, { type: 'transferFacilitator', participantId: ben.data.participantId! }, server);
			expect(lastState(log).facilitatorId).toBe(ben.data.participantId!);
		});

		test('publishes to the sender’s room only', () => {
			const { log, server, roomId, ana } = seated();
			handleIntent(ana, { type: 'setDeck', deckId: 't-shirt' }, server);
			expect(log).toEqual([expect.objectContaining({ to: 'topic', topic: roomId })]);
		});
	});
});
