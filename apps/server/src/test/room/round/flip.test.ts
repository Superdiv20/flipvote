import { describe, expect, test } from 'bun:test';
import { flip, reveal } from '../../../room/round/flip';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';
import { vote } from '../../../room/round/vote';

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

describe('reveal', () => {
	test('reveals without asking who wants it, as the auto flip does', () => {
		const room = unwrap(vote(seatedRoom(), 'ben', '5'));
		const revealed = unwrap(applyPure(room, (r) => reveal(r)));
		expect(revealed.phase).toBe('revealed');
		expect(revealed.result?.voteCount).toBe(1);
	});

	test('still needs a vote and an open round', () => {
		expect(reveal(seatedRoom())).toEqual({ ok: false, code: 'NO_VOTES' });
		const revealed = unwrap(reveal(unwrap(vote(seatedRoom(), 'ben', '5'))));
		expect(reveal(revealed)).toEqual({ ok: false, code: 'ALREADY_REVEALED' });
	});
});
