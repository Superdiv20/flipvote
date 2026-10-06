import { describe, expect, test } from 'bun:test';
import { flip } from '../../../room/round/flip';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';
import { toggleSpectator } from '../../../room/participants/toggle-spectator';
import { vote } from '../../../room/round/vote';

describe('vote', () => {
	test('casts, changes and withdraws a vote', () => {
		const voted = unwrap(applyPure(seatedRoom(), (r) => vote(r, 'ben', '5')));
		expect(voted.votes.get('ben')).toBe('5');
		const changed = unwrap(vote(voted, 'ben', '8'));
		expect(changed.votes.get('ben')).toBe('8');
		const withdrawn = unwrap(applyPure(changed, (r) => vote(r, 'ben', null)));
		expect(withdrawn.votes.has('ben')).toBe(false);
	});

	test('accepts special cards', () => {
		expect(unwrap(vote(seatedRoom(), 'ben', 'coffee')).votes.get('ben')).toBe('coffee');
	});

	test('rejects a card that is not in the deck', () => {
		expect(vote(seatedRoom(), 'ben', '4')).toEqual({ ok: false, code: 'INVALID_CARD' });
	});

	test('rejects spectators', () => {
		const room = unwrap(toggleSpectator(seatedRoom(), 'ben', true));
		expect(vote(room, 'ben', '5')).toEqual({ ok: false, code: 'SPECTATOR_CANNOT_VOTE' });
	});

	test('only accepts votes while voting', () => {
		const revealed = unwrap(flip(unwrap(vote(seatedRoom(), 'ana', '5')), 'ana'));
		expect(vote(revealed, 'ben', '5')).toEqual({ ok: false, code: 'ALREADY_REVEALED' });
	});

	test('rejects someone who is not in the room', () => {
		expect(vote(seatedRoom(), 'zoe', '5')).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});
