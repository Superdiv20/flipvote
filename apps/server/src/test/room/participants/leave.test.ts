import { describe, expect, test } from 'bun:test';
import { flip } from '../../../room/round/flip';
import { leave } from '../../../room/participants/leave';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';
import { vote } from '../../../room/round/vote';

describe('leave', () => {
	test('removes the participant and their vote', () => {
		const room = unwrap(vote(seatedRoom(), 'ben', '3'));
		const after = unwrap(applyPure(room, (r) => leave(r, 'ben')));
		expect([...after.participants.keys()]).toEqual(['ana', 'cy']);
		expect(after.votes.has('ben')).toBe(false);
		expect(after.facilitatorId).toBe('ana');
	});

	test('hands the facilitator role to the next participant in join order', () => {
		expect(unwrap(leave(seatedRoom(), 'ana')).facilitatorId).toBe('ben');
	});

	test('wraps around to the first participant when the last one was facilitator', () => {
		const room = { ...seatedRoom(), facilitatorId: 'cy' };
		expect(unwrap(leave(room, 'cy')).facilitatorId).toBe('ana');
	});

	test('leaves no facilitator when the room is empty', () => {
		expect(unwrap(leave(seatedRoom(['ana']), 'ana')).facilitatorId).toBeNull();
	});

	test('keeps the stored result when someone leaves after the flip', () => {
		let room = unwrap(vote(seatedRoom(), 'ana', '3'));
		room = unwrap(vote(room, 'ben', '8'));
		room = unwrap(flip(room, 'ana'));
		const after = unwrap(leave(room, 'ben'));
		expect(after.result).toEqual(room.result);
		expect(after.result?.voteCount).toBe(2);
	});

	test('rejects someone who is not in the room', () => {
		expect(leave(seatedRoom(), 'zoe')).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});
