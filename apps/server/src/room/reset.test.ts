import { describe, expect, test } from 'bun:test';
import { addIssue } from './add-issue';
import { flip } from './flip';
import { reset } from './reset';
import type { Room } from './room';
import { applyPure, seatedRoom, unwrap } from './testing';
import { vote } from './vote';

function withIssues(): Room {
	let room = seatedRoom();
	for (const id of ['i1', 'i2', 'i3']) room = unwrap(addIssue(room, 'ana', id, { title: id }));
	return room;
}

describe('reset', () => {
	test('clears votes and result and returns to voting', () => {
		const revealed = unwrap(flip(unwrap(vote(seatedRoom(), 'ana', '8')), 'ana'));
		const next = unwrap(applyPure(revealed, (r) => reset(r, 'ana')));
		expect(next.phase).toBe('voting');
		expect(next.votes.size).toBe(0);
		expect(next.result).toBeNull();
	});

	test('records the suggested estimate and moves to the next open issue', () => {
		let room = unwrap(vote(withIssues(), 'ana', '5'));
		room = unwrap(vote(room, 'ben', '5'));
		const next = unwrap(reset(unwrap(flip(room, 'ana')), 'ana'));
		expect(next.issues.find((issue) => issue.id === 'i1')?.estimate).toBe('5');
		expect(next.currentIssueId).toBe('i2');
	});

	test('stays on the issue when there is no numeric vote', () => {
		const room = unwrap(flip(unwrap(vote(withIssues(), 'ana', '?')), 'ana'));
		const next = unwrap(reset(room, 'ana'));
		expect(next.currentIssueId).toBe('i1');
		expect(next.issues[0]?.estimate).toBeUndefined();
	});

	test('records nothing when reset during voting', () => {
		const next = unwrap(reset(unwrap(vote(withIssues(), 'ana', '5')), 'ana'));
		expect(next.currentIssueId).toBe('i1');
		expect(next.votes.size).toBe(0);
	});

	test('is facilitator only', () => {
		expect(reset(seatedRoom(), 'ben')).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
	});
});
