import { describe, expect, test } from 'bun:test';
import { setConnected } from '../../../room/participants/set-connected';
import { toggleSpectator } from '../../../room/participants/toggle-spectator';
import { readyToAutoFlip, setAutoFlip, startCountdown } from '../../../room/round/auto-flip';
import { reset } from '../../../room/round/reset';
import { flip } from '../../../room/round/flip';
import { vote } from '../../../room/round/vote';
import type { Room } from '../../../room/room';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';

/** Ana, Ben and Cy with the auto flip on. */
const autoRoom = (): Room => unwrap(setAutoFlip(seatedRoom(), 'ana', true));

function allVoted(room: Room = autoRoom()): Room {
	for (const id of ['ana', 'ben', 'cy']) room = unwrap(vote(room, id, '5'));
	return room;
}

describe('setAutoFlip', () => {
	test('turns it on and off', () => {
		const on = unwrap(applyPure(seatedRoom(), (r) => setAutoFlip(r, 'ana', true)));
		expect(on.autoFlip).toBe(true);
		expect(unwrap(setAutoFlip(on, 'ana', false)).autoFlip).toBe(false);
	});

	test('is off in a new room', () => {
		expect(seatedRoom().autoFlip).toBe(false);
	});

	test('is for the facilitator only', () => {
		expect(setAutoFlip(seatedRoom(), 'ben', true)).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
	});

	test('rejects someone who is not in the room', () => {
		expect(setAutoFlip(seatedRoom(), 'zoe', true)).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});

describe('readyToAutoFlip', () => {
	test('once everyone has voted', () => {
		expect(readyToAutoFlip(allVoted())).toBe(true);
	});

	test('not while someone still has to vote', () => {
		let room = autoRoom();
		room = unwrap(vote(room, 'ana', '5'));
		room = unwrap(vote(room, 'ben', '5'));
		expect(readyToAutoFlip(room)).toBe(false);
	});

	test('not when the auto flip is off', () => {
		expect(readyToAutoFlip(allVoted(seatedRoom()))).toBe(false);
	});

	test('not after the flip', () => {
		expect(readyToAutoFlip(unwrap(flip(allVoted(), 'ana')))).toBe(false);
	});

	test('does not wait for a spectator', () => {
		let room = unwrap(toggleSpectator(autoRoom(), 'cy', true));
		room = unwrap(vote(room, 'ana', '5'));
		room = unwrap(vote(room, 'ben', '8'));
		expect(readyToAutoFlip(room)).toBe(true);
	});

	test('does not wait for someone who is away', () => {
		let room = unwrap(setConnected(autoRoom(), 'cy', false));
		room = unwrap(vote(room, 'ana', '5'));
		room = unwrap(vote(room, 'ben', '8'));
		expect(readyToAutoFlip(room)).toBe(true);
	});

	test('not when only spectators are left', () => {
		let room = autoRoom();
		for (const id of ['ana', 'ben', 'cy']) room = unwrap(toggleSpectator(room, id, true));
		expect(readyToAutoFlip(room)).toBe(false);
	});
});

describe('the countdown', () => {
	const counting = () => startCountdown(allVoted());

	test('locks every vote change', () => {
		const room = counting();
		expect(vote(room, 'ben', '8')).toEqual({ ok: false, code: 'VOTES_LOCKED' });
		expect(vote(room, 'ben', null)).toEqual({ ok: false, code: 'VOTES_LOCKED' });
	});

	test('locks switching to watch only', () => {
		expect(toggleSpectator(counting(), 'ben', true)).toEqual({ ok: false, code: 'VOTES_LOCKED' });
	});

	test('does not start twice', () => {
		expect(readyToAutoFlip(counting())).toBe(false);
	});

	test('ends with the flip', () => {
		expect(unwrap(flip(counting(), 'ana')).countingDown).toBe(false);
	});

	test('ends with a new round', () => {
		expect(unwrap(reset(counting(), 'ana')).countingDown).toBe(false);
	});

	test('ends when the auto flip is turned off, but not when it is turned on again', () => {
		expect(unwrap(setAutoFlip(counting(), 'ana', false)).countingDown).toBe(false);
		expect(unwrap(setAutoFlip(counting(), 'ana', true)).countingDown).toBe(true);
	});
});
