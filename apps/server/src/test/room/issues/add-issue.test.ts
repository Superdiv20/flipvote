import { describe, expect, test } from 'bun:test';
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
