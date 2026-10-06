import { describe, expect, test } from 'bun:test';
import type { IssueInput } from '@flipvote/protocol';
import { addIssue } from '../../../room/issues/add-issue';
import { editIssue } from '../../../room/issues/edit-issue';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';

function roomWithIssue() {
	const room = unwrap(addIssue(seatedRoom(), 'ana', 'i1', { key: 'ATL-1', title: 'Export', link: 'https://x.test' }));
	return { ...room, issues: [{ ...room.issues[0]!, estimate: '5' }] };
}

describe('editIssue', () => {
	test('anyone can change the given fields; blank optional fields are removed', () => {
		const room = unwrap(
			applyPure(roomWithIssue(), (r) => editIssue(r, 'cy', 'i1', { title: 'Bulk export', link: '', description: 'New' })),
		);
		expect(room.issues[0]).toEqual({ id: 'i1', key: 'ATL-1', title: 'Bulk export', description: 'New', estimate: '5' });
	});

	test('cannot change the estimate', () => {
		const changes = { title: 'X', estimate: '13' } as Partial<IssueInput>;
		expect(unwrap(editIssue(roomWithIssue(), 'ben', 'i1', changes)).issues[0]?.estimate).toBe('5');
	});

	test('rejects a blank title and unknown issues', () => {
		expect(editIssue(roomWithIssue(), 'ben', 'i1', { title: ' ' })).toEqual({ ok: false, code: 'TITLE_REQUIRED' });
		expect(editIssue(roomWithIssue(), 'ben', 'nope', { title: 'X' })).toEqual({ ok: false, code: 'ISSUE_NOT_FOUND' });
	});
});
