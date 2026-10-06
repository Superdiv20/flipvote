import { describe, expect, test } from 'bun:test';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';
import { toggleSpectator } from '../../../room/participants/toggle-spectator';
import { vote } from '../../../room/round/vote';

describe('toggleSpectator', () => {
	test('becoming a spectator drops the current vote', () => {
		const room = unwrap(vote(seatedRoom(), 'ben', '5'));
		const next = unwrap(applyPure(room, (r) => toggleSpectator(r, 'ben', true)));
		expect(next.participants.get('ben')?.isSpectator).toBe(true);
		expect(next.votes.has('ben')).toBe(false);
	});

	test('a spectator can become a voter again', () => {
		const spectator = unwrap(toggleSpectator(seatedRoom(), 'ben', true));
		expect(unwrap(toggleSpectator(spectator, 'ben', false)).participants.get('ben')?.isSpectator).toBe(false);
	});

	test('rejects someone who is not in the room', () => {
		expect(toggleSpectator(seatedRoom(), 'zoe', true)).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});
