import { describe, expect, test } from 'bun:test';
import { setConnected } from '../../../room/participants/set-connected';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';

describe('setConnected', () => {
	test('marks a participant as disconnected and back', () => {
		const offline = unwrap(applyPure(seatedRoom(), (r) => setConnected(r, 'ben', false)));
		expect(offline.participants.get('ben')?.connected).toBe(false);
		expect(unwrap(setConnected(offline, 'ben', true)).participants.get('ben')?.connected).toBe(true);
	});

	test('rejects someone who is not in the room', () => {
		expect(setConnected(seatedRoom(), 'zoe', false)).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});
