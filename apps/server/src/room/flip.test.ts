import { describe, expect, test } from 'bun:test';
import { flip } from './flip';
import { applyPure, seatedRoom, unwrap } from './testing';
import { vote } from './vote';

describe('flip', () => {
	test('reveals the cards and stores the result', () => {
		let room = unwrap(vote(seatedRoom(), 'ana', '3'));
		room = unwrap(vote(room, 'ben', '5'));
		const revealed = unwrap(applyPure(room, (r) => flip(r, 'ana')));
		expect(revealed.phase).toBe('revealed');
		expect(revealed.result).toMatchObject({ voteCount: 2, average: 4 });
	});

	test('is facilitator only', () => {
		const room = unwrap(vote(seatedRoom(), 'ana', '3'));
		expect(flip(room, 'ben')).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
	});

	test('needs at least one vote', () => {
		expect(flip(seatedRoom(), 'ana')).toEqual({ ok: false, code: 'NO_VOTES' });
	});

	test('cannot flip twice', () => {
		const revealed = unwrap(flip(unwrap(vote(seatedRoom(), 'ana', '3')), 'ana'));
		expect(flip(revealed, 'ana')).toEqual({ ok: false, code: 'ALREADY_REVEALED' });
	});
});
