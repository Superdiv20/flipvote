import { describe, expect, test } from 'bun:test';
import { addIssue } from './issues/add-issue';
import { join } from './participants/join';
import { setConnected } from './participants/set-connected';
import { toggleSpectator } from './participants/toggle-spectator';
import { createRoom, type Participant, type Room } from './room';
import { flip } from './round/flip';
import { reset } from './round/reset';
import { vote } from './round/vote';
import { seatedRoom, unwrap } from './testing';
import { ownVote, toSharedState } from './to-shared-state';
import { DECKS } from '@flipvote/protocol';

/** Ana voted 3, Ben voted 8, Cy hasn't voted. Ana's issue `i1` is current. */
function votedRoom(): Room {
	let room = unwrap(addIssue(seatedRoom(), 'ana', 'i1', { key: 'ATL-1', title: 'Export' }));
	room = unwrap(vote(room, 'ana', '3'));
	return unwrap(vote(room, 'ben', '8'));
}

/** The serialised state without the deck, whose card list contains every vote value. */
function withoutDeck(room: Room): string {
	return JSON.stringify({ ...toSharedState(room), deck: null });
}

describe('toSharedState', () => {
	describe('before the flip', () => {
		test('shows who has voted, but no vote values', () => {
			const state = toSharedState(votedRoom());
			expect(state.participants.map((p) => [p.id, p.hasVoted, 'vote' in p])).toEqual([
				['ana', true, false],
				['ben', true, false],
				['cy', false, false],
			]);
		});

		test('contains no vote value anywhere', () => {
			const json = withoutDeck(votedRoom());
			expect(json).not.toContain('"3"');
			expect(json).not.toContain('"8"');
		});

		test('has no result', () => {
			expect(toSharedState(votedRoom()).result).toBeNull();
		});

		test('hides a lingering result while voting', () => {
			// A result is only ever set by the flip, but the mapping must not rely on that.
			const revealed = unwrap(flip(votedRoom(), 'ana'));
			const state = toSharedState({ ...revealed, phase: 'voting' });
			expect(state.result).toBeNull();
			expect(state.participants.some((p) => 'vote' in p)).toBe(false);
		});
	});

	describe('after the flip', () => {
		test('shows every vote and the result', () => {
			const state = toSharedState(unwrap(flip(votedRoom(), 'ana')));
			expect(state.phase).toBe('revealed');
			expect(state.participants.map((p) => p.vote)).toEqual(['3', '8', undefined]);
			expect(state.result).toMatchObject({ voteCount: 2, average: 5.5 });
		});

		test('hides the votes again once the next round starts', () => {
			const next = unwrap(reset(unwrap(flip(votedRoom(), 'ana')), 'ana'));
			const state = toSharedState(next);
			expect(state.phase).toBe('voting');
			expect(state.result).toBeNull();
			expect(state.participants.every((p) => !p.hasVoted && !('vote' in p))).toBe(true);
		});
	});

	describe('the same state for everyone', () => {
		test('has no per-recipient fields', () => {
			expect(Object.keys(toSharedState(votedRoom())).sort()).toEqual(
				['currentIssueId', 'deck', 'facilitatorId', 'id', 'issues', 'name', 'participants', 'phase', 'result'].sort(),
			);
		});

		test('is the same no matter who has voted what', () => {
			// Swapping the vote values changes nothing before the flip, so nobody can infer them.
			let swapped = unwrap(addIssue(seatedRoom(), 'ana', 'i1', { key: 'ATL-1', title: 'Export' }));
			swapped = unwrap(vote(swapped, 'ana', '8'));
			swapped = unwrap(vote(swapped, 'ben', '3'));
			expect(toSharedState(swapped)).toEqual(toSharedState(votedRoom()));
		});
	});

	describe('mapping', () => {
		test('maps the room fields', () => {
			expect(toSharedState(votedRoom())).toMatchObject({
				id: 'room-1',
				name: 'Sprint 42',
				deck: DECKS.fibonacci,
				phase: 'voting',
				facilitatorId: 'ana',
				currentIssueId: 'i1',
				issues: [{ id: 'i1', key: 'ATL-1', title: 'Export' }],
			});
		});

		test('maps spectators and disconnected participants', () => {
			let room = unwrap(toggleSpectator(seatedRoom(), 'ben', true));
			room = unwrap(setConnected(room, 'cy', false));
			expect(toSharedState(room).participants).toEqual([
				{ id: 'ana', name: 'ANA', isSpectator: false, connected: true, hasVoted: false },
				{ id: 'ben', name: 'BEN', isSpectator: true, connected: true, hasVoted: false },
				{ id: 'cy', name: 'CY', isSpectator: false, connected: false, hasVoted: false },
			]);
		});

		test('keeps the join order', () => {
			const room = unwrap(join(seatedRoom(['cy', 'ana']), 'ben', 'Ben', 'token-ben'));
			expect(toSharedState(room).participants.map((p) => p.id)).toEqual(['cy', 'ana', 'ben']);
		});

		test('never leaks server-only fields', () => {
			const room = votedRoom();
			const withSecret = new Map(room.participants).set('ana', {
				...room.participants.get('ana')!,
				internalNote: 'secret',
			} as Participant);
			const json = JSON.stringify(toSharedState({ ...room, participants: withSecret }));
			expect(json).not.toContain('secret');
			expect(json).not.toContain('token-');
			expect(json).not.toContain(room.creatorToken);
		});

		test('does not share references with the room', () => {
			const room = unwrap(flip(votedRoom(), 'ana'));
			const state = toSharedState(room);
			state.deck.cards.push('999');
			state.result!.distribution.pop();
			state.issues[0]!.title = 'Changed';
			expect(room.deck.cards).not.toContain('999');
			expect(room.result?.distribution).toHaveLength(2);
			expect(room.issues[0]!.title).toBe('Export');
		});

		test('throws for a room nobody has joined', () => {
			const empty = createRoom({ id: 'r', name: 'R', deck: DECKS.fibonacci, creatorToken: 'token-creator' });
			expect(() => toSharedState(empty)).toThrow();
		});
	});
});

describe('ownVote', () => {
	test('returns the participant’s own vote before the flip', () => {
		expect(ownVote(votedRoom(), 'ben')).toBe('8');
	});

	test('returns null for someone who has not voted', () => {
		expect(ownVote(votedRoom(), 'cy')).toBeNull();
	});

	test('returns null for someone who is not in the room', () => {
		expect(ownVote(votedRoom(), 'zoe')).toBeNull();
	});

	test('returns null once the next round starts', () => {
		const next = unwrap(reset(unwrap(flip(votedRoom(), 'ana')), 'ana'));
		expect(ownVote(next, 'ben')).toBeNull();
	});
});
