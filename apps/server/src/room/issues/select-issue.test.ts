import { describe, expect, test } from 'bun:test';
import { addIssue } from './add-issue';
import { flip } from '../round/flip';
import { selectIssue } from './select-issue';
import { applyPure, seatedRoom, unwrap } from '../testing';
import { vote } from '../round/vote';

function withIssues() {
	let room = seatedRoom();
	for (const id of ['i1', 'i2']) room = unwrap(addIssue(room, 'ana', id, { title: id }));
	return room;
}

describe('selectIssue', () => {
	test('makes the issue current and clears the votes during voting', () => {
		const room = unwrap(vote(withIssues(), 'ben', '5'));
		const next = unwrap(applyPure(room, (r) => selectIssue(r, 'ana', 'i2')));
		expect(next.currentIssueId).toBe('i2');
		expect(next.votes.size).toBe(0);
	});

	test('after a flip, starts a new round on the selected issue', () => {
		const revealed = unwrap(flip(unwrap(vote(withIssues(), 'ana', '5')), 'ana'));
		const next = unwrap(selectIssue(revealed, 'ana', 'i2'));
		expect(next.phase).toBe('voting');
		expect(next.result).toBeNull();
	});

	test('selecting the current issue changes nothing', () => {
		const room = unwrap(vote(withIssues(), 'ben', '5'));
		expect(unwrap(selectIssue(room, 'ana', 'i1'))).toBe(room);
	});

	test('is facilitator only and rejects unknown issues', () => {
		expect(selectIssue(withIssues(), 'ben', 'i2')).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
		expect(selectIssue(withIssues(), 'ana', 'nope')).toEqual({ ok: false, code: 'ISSUE_NOT_FOUND' });
	});
});
