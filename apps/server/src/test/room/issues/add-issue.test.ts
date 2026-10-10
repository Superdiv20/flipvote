import { describe, expect, test } from 'bun:test';
import { ISSUE_LIMITS, MAX_ISSUES_PER_ROOM } from '@flipvote/protocol';
import { addIssue } from '../../../room/issues/add-issue';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';

describe('addIssue', () => {
	test('anyone can add; the first issue becomes current', () => {
		const room = unwrap(
			applyPure(seatedRoom(), (r) =>
				addIssue(r, 'ben', 'i1', { key: 'ATL-1', title: '  Export  ', link: ' ', description: 'Details' }),
			),
		);
		expect(room.issues).toEqual([{ id: 'i1', key: 'ATL-1', title: 'Export', description: 'Details' }]);
		expect(room.currentIssueId).toBe('i1');

		const two = unwrap(addIssue(room, 'cy', 'i2', { title: 'Import' }));
		expect(two.issues.map((issue) => issue.id)).toEqual(['i1', 'i2']);
		expect(two.currentIssueId).toBe('i1');
	});

	test('rejects a blank title', () => {
		expect(addIssue(seatedRoom(), 'ben', 'i1', { title: '  ' })).toEqual({ ok: false, code: 'TITLE_REQUIRED' });
	});

	test('rejects someone who is not in the room', () => {
		expect(addIssue(seatedRoom(), 'zoe', 'i1', { title: 'X' })).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});

describe('addIssue limits', () => {
	test.each(Object.entries(ISSUE_LIMITS))('accepts a %s of exactly its limit', (field, limit) => {
		const input = { title: 'Export', [field]: 'x'.repeat(limit) };
		expect(addIssue(seatedRoom(), 'ana', 'i1', input).ok).toBe(true);
	});

	test.each(Object.entries(ISSUE_LIMITS))('rejects a %s over its limit', (field, limit) => {
		const input = { title: 'Export', [field]: 'x'.repeat(limit + 1) };
		expect(addIssue(seatedRoom(), 'ana', 'i1', input)).toEqual({ ok: false, code: 'ISSUE_TOO_LONG' });
	});

	test('measures after trimming', () => {
		const input = { title: `  ${'x'.repeat(ISSUE_LIMITS.title)}  ` };
		expect(addIssue(seatedRoom(), 'ana', 'i1', input).ok).toBe(true);
	});

	test('rejects one issue more than a room may have', () => {
		let room = seatedRoom();
		for (let i = 0; i < MAX_ISSUES_PER_ROOM; i++) room = unwrap(addIssue(room, 'ana', `i${i}`, { title: `#${i}` }));
		expect(addIssue(room, 'ana', 'one-more', { title: 'One more' })).toEqual({ ok: false, code: 'TOO_MANY_ISSUES' });
	});
});
