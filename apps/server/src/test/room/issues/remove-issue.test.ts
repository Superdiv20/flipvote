import { describe, expect, test } from 'bun:test';
import type { Room } from '../../../room/room';
import { flip } from '../../../room/round/flip';
import { vote } from '../../../room/round/vote';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';
import { addIssue } from '../../../room/issues/add-issue';
import { removeIssue } from '../../../room/issues/remove-issue';

/** Issues i1, i2, i3; i1 is current (the first added issue becomes current). */
function withIssues(): Room {
	let room = seatedRoom();
	for (const id of ['i1', 'i2', 'i3']) room = unwrap(addIssue(room, 'ana', id, { title: id }));
	return room;
}

function estimated(room: Room, id: string, estimate: string): Room {
	return { ...room, issues: room.issues.map((issue) => (issue.id === id ? { ...issue, estimate } : issue)) };
}

describe('removeIssue', () => {
	test('removes an issue that is not current and leaves the round alone', () => {
		const room = unwrap(vote(withIssues(), 'ben', '5'));
		const next = unwrap(applyPure(room, (r) => removeIssue(r, 'ana', 'i2')));
		expect(next.issues.map((issue) => issue.id)).toEqual(['i1', 'i3']);
		expect(next.currentIssueId).toBe('i1');
		expect(next.votes.get('ben')).toBe('5');
	});

	test('removing the current issue moves on to the next open one and starts a new round', () => {
		const room = unwrap(vote(withIssues(), 'ben', '5'));
		const next = unwrap(applyPure(room, (r) => removeIssue(r, 'ana', 'i1')));
		expect(next.issues.map((issue) => issue.id)).toEqual(['i2', 'i3']);
		expect(next.currentIssueId).toBe('i2');
		expect(next.votes.size).toBe(0);
		expect(next.phase).toBe('voting');
	});

	test('skips issues that already have an estimate', () => {
		const room = estimated(withIssues(), 'i2', '8');
		expect(unwrap(removeIssue(room, 'ana', 'i1')).currentIssueId).toBe('i3');
	});

	test('wraps around to an open issue before the removed one', () => {
		const room = { ...estimated(withIssues(), 'i3', '8'), currentIssueId: 'i2' };
		expect(unwrap(removeIssue(room, 'ana', 'i2')).currentIssueId).toBe('i1');
	});

	test('leaves no current issue when no open one is left', () => {
		const room = estimated(estimated(withIssues(), 'i2', '8'), 'i3', '5');
		expect(unwrap(removeIssue(room, 'ana', 'i1')).currentIssueId).toBeNull();
	});

	test('removing the current issue after the flip clears the result', () => {
		const revealed = unwrap(flip(unwrap(vote(withIssues(), 'ana', '5')), 'ana'));
		const next = unwrap(removeIssue(revealed, 'ana', 'i1'));
		expect(next.phase).toBe('voting');
		expect(next.result).toBeNull();
	});

	test('removing the last issue leaves an empty list', () => {
		let room = unwrap(addIssue(seatedRoom(), 'ana', 'i1', { title: 'Only' }));
		room = unwrap(removeIssue(room, 'ana', 'i1'));
		expect(room.issues).toEqual([]);
		expect(room.currentIssueId).toBeNull();
	});

	test('is for the facilitator only', () => {
		expect(removeIssue(withIssues(), 'ben', 'i2')).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
	});

	test('rejects someone who is not in the room', () => {
		expect(removeIssue(withIssues(), 'zoe', 'i2')).toEqual({ ok: false, code: 'NOT_JOINED' });
	});

	test('rejects an unknown issue', () => {
		expect(removeIssue(withIssues(), 'ana', 'nope')).toEqual({ ok: false, code: 'ISSUE_NOT_FOUND' });
	});
});
