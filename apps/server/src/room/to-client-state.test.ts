import { describe, expect, test } from 'bun:test';
import { addIssue } from './add-issue';
import { flip } from './flip';
import type { Participant, Room } from './room';
import { seatedRoom, unwrap } from './testing';
import { toClientState } from './to-client-state';
import { vote } from './vote';

function votedRoom(): Room {
	let room = unwrap(addIssue(seatedRoom(), 'ana', 'i1', { key: 'ATL-1', title: 'Export' }));
	room = unwrap(vote(room, 'ana', '3'));
	return unwrap(vote(room, 'ben', '8'));
}

describe('toClientState', () => {
	test('hides other votes before the flip but includes the own vote', () => {
		const state = toClientState(votedRoom(), 'ben');
		expect(state.participants.map((p) => [p.id, p.hasVoted, 'vote' in p])).toEqual([
			['ana', true, false],
			['ben', true, false],
			['cy', false, false],
		]);
		expect(state.myVote).toBe('8');
		expect(state.selfId).toBe('ben');
		expect(state.result).toBeNull();
		// Ana's 3 must not appear anywhere outside the deck's card list.
		expect(JSON.stringify({ ...state, deck: null })).not.toContain('"3"');
	});

	test('sends null as myVote when the recipient has not voted', () => {
		expect(toClientState(votedRoom(), 'cy').myVote).toBeNull();
	});

	test('shows all votes and the result once revealed', () => {
		const state = toClientState(unwrap(flip(votedRoom(), 'ana')), 'cy');
		expect(state.phase).toBe('revealed');
		expect(state.participants.map((p) => p.vote)).toEqual(['3', '8', undefined]);
		expect(state.result).toMatchObject({ voteCount: 2, average: 5.5 });
	});

	test('maps the room fields', () => {
		const state = toClientState(votedRoom(), 'ana');
		expect(state).toMatchObject({
			id: 'room-1',
			name: 'Sprint 42',
			phase: 'voting',
			facilitatorId: 'ana',
			currentIssueId: 'i1',
			issues: [{ id: 'i1', key: 'ATL-1', title: 'Export' }],
		});
		expect(state.deck.cards).toContain('13');
	});

	test('never leaks server-only fields', () => {
		const room = votedRoom();
		const withSecret = new Map(room.participants).set('ana', {
			...room.participants.get('ana')!,
			sessionToken: 'secret',
		} as Participant);
		const state = toClientState({ ...room, participants: withSecret }, 'ana');
		expect(JSON.stringify(state)).not.toContain('secret');
		expect(Object.keys(state).sort()).toEqual(
			['currentIssueId', 'deck', 'facilitatorId', 'id', 'issues', 'myVote', 'name', 'participants', 'phase', 'result', 'selfId'].sort(),
		);
	});

	test('does not share references with the room', () => {
		const room = unwrap(flip(votedRoom(), 'ana'));
		const state = toClientState(room, 'ana');
		state.deck.cards.push('999');
		state.result!.distribution.pop();
		expect(room.deck.cards).not.toContain('999');
		expect(room.result?.distribution).toHaveLength(2);
	});

	test('throws for a recipient who is not in the room', () => {
		expect(() => toClientState(votedRoom(), 'zoe')).toThrow();
	});
});
