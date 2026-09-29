import { describe, expect, test } from 'bun:test';
import { DECKS } from '@flipvote/protocol';
import { join } from './join';
import { createRoom } from './room';
import { applyPure, seatedRoom, unwrap } from './testing';
import { vote } from './vote';

describe('join', () => {
	test('seats a new participant and makes the first one facilitator', () => {
		const empty = createRoom({ id: 'r', name: 'R', deck: DECKS.fibonacci });
		const room = unwrap(applyPure(empty, (r) => join(r, 'ana', '  Ana  ')));
		expect(room.participants.get('ana')).toEqual({ id: 'ana', name: 'Ana', isSpectator: false, connected: true });
		expect(room.facilitatorId).toBe('ana');

		const withBen = unwrap(join(room, 'ben', 'Ben'));
		expect(withBen.facilitatorId).toBe('ana');
		expect([...withBen.participants.keys()]).toEqual(['ana', 'ben']);
	});

	test('rejoining keeps the seat, the vote and spectator status', () => {
		let room = unwrap(vote(seatedRoom(), 'ana', '5'));
		room = { ...room, participants: new Map(room.participants).set('ana', { ...room.participants.get('ana')!, connected: false }) };
		const rejoined = unwrap(applyPure(room, (r) => join(r, 'ana', 'Ana K')));
		expect([...rejoined.participants.keys()]).toEqual(['ana', 'ben', 'cy']);
		expect(rejoined.participants.get('ana')).toMatchObject({ name: 'Ana K', connected: true });
		expect(rejoined.votes.get('ana')).toBe('5');
	});

	test('rejects a blank name', () => {
		expect(join(seatedRoom(), 'dan', '   ')).toEqual({ ok: false, code: 'NAME_REQUIRED' });
	});
});
