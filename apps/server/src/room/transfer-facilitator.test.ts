import { describe, expect, test } from 'bun:test';
import { flip } from './flip';
import { setConnected } from './set-connected';
import { applyPure, seatedRoom, unwrap } from './testing';
import { transferFacilitator } from './transfer-facilitator';
import { vote } from './vote';

describe('transferFacilitator', () => {
	test('hands the role to another participant', () => {
		const room = unwrap(
			applyPure(seatedRoom(), (r) => transferFacilitator(r, 'ana', 'cy')),
		);
		expect(room.facilitatorId).toBe('cy');
	});

	test('leaves votes, phase and result as they are', () => {
		let room = unwrap(vote(seatedRoom(), 'ana', '3'));
		room = unwrap(vote(room, 'ben', '8'));
		room = unwrap(flip(room, 'ana'));
		const next = unwrap(transferFacilitator(room, 'ana', 'ben'));
		expect(next.votes).toEqual(room.votes);
		expect(next.phase).toBe('revealed');
		expect(next.result).toEqual(room.result);
	});

	test('the new facilitator can pass it on, the old one no longer can', () => {
		const room = unwrap(transferFacilitator(seatedRoom(), 'ana', 'ben'));
		expect(transferFacilitator(room, 'ana', 'cy')).toEqual({
			ok: false,
			code: 'NOT_FACILITATOR',
		});
		expect(unwrap(transferFacilitator(room, 'ben', 'cy')).facilitatorId).toBe(
			'cy',
		);
	});

	test('is facilitator only', () => {
		expect(transferFacilitator(seatedRoom(), 'ben', 'ben')).toEqual({
			ok: false,
			code: 'NOT_FACILITATOR',
		});
		expect(transferFacilitator(seatedRoom(), 'zoe', 'ben')).toEqual({
			ok: false,
			code: 'NOT_JOINED',
		});
	});

	test('checks the sender before revealing whether the target exists', () => {
		expect(transferFacilitator(seatedRoom(), 'ben', 'nobody')).toEqual({
			ok: false,
			code: 'NOT_FACILITATOR',
		});
	});

	test('rejects a target who is not in the room', () => {
		expect(transferFacilitator(seatedRoom(), 'ana', 'nobody')).toEqual({
			ok: false,
			code: 'PARTICIPANT_NOT_FOUND',
		});
	});

	test('rejects a target in their reconnect grace period', () => {
		const room = unwrap(setConnected(seatedRoom(), 'cy', false));
		expect(transferFacilitator(room, 'ana', 'cy')).toEqual({
			ok: false,
			code: 'PARTICIPANT_NOT_CONNECTED',
		});
	});

	test('transferring to yourself keeps the role', () => {
		expect(
			unwrap(transferFacilitator(seatedRoom(), 'ana', 'ana')).facilitatorId,
		).toBe('ana');
	});
});
