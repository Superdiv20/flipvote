import { describe, expect, test } from 'bun:test';
import { setOnlyFacilitatorCanFlip } from '../../../room/round/only-facilitator-can-flip';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';

describe('setOnlyFacilitatorCanFlip', () => {
	test('is on in a new room', () => {
		expect(seatedRoom().onlyFacilitatorCanFlip).toBe(true);
	});

	test('can be turned off and on again', () => {
		const off = unwrap(applyPure(seatedRoom(), (r) => setOnlyFacilitatorCanFlip(r, 'ana', false)));
		expect(off.onlyFacilitatorCanFlip).toBe(false);
		expect(unwrap(setOnlyFacilitatorCanFlip(off, 'ana', true)).onlyFacilitatorCanFlip).toBe(true);
	});

	test('is for the facilitator only', () => {
		expect(setOnlyFacilitatorCanFlip(seatedRoom(), 'ben', false)).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
	});

	test('rejects someone who is not in the room', () => {
		expect(setOnlyFacilitatorCanFlip(seatedRoom(), 'zoe', false)).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});
