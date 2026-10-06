import { describe, expect, test } from 'bun:test';
import { NAME_MAX_LENGTH } from '@flipvote/protocol';
import { setName } from '../../../room/participants/set-name';
import { toggleSpectator } from '../../../room/participants/toggle-spectator';
import { vote } from '../../../room/round/vote';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';

describe('setName', () => {
	test('renames the seat and trims the name', () => {
		const room = unwrap(applyPure(seatedRoom(), (r) => setName(r, 'ben', '  Ben K  ')));
		expect(room.participants.get('ben')?.name).toBe('Ben K');
	});

	test('keeps the seat in its place in join order', () => {
		const room = unwrap(setName(seatedRoom(), 'ben', 'Ben K'));
		expect([...room.participants.keys()]).toEqual(['ana', 'ben', 'cy']);
	});

	test('keeps the vote, spectator mode and the facilitator role', () => {
		let room = unwrap(vote(seatedRoom(), 'ana', '5'));
		room = unwrap(toggleSpectator(room, 'cy', true));

		const renamedFacilitator = unwrap(setName(room, 'ana', 'Ana K'));
		expect(renamedFacilitator.votes.get('ana')).toBe('5');
		expect(renamedFacilitator.facilitatorId).toBe('ana');

		const renamedSpectator = unwrap(setName(room, 'cy', 'Cy K'));
		expect(renamedSpectator.participants.get('cy')?.isSpectator).toBe(true);
	});

	test('keeps the session token, so the seat can still be rejoined', () => {
		const room = unwrap(setName(seatedRoom(), 'ben', 'Ben K'));
		expect(room.participants.get('ben')?.sessionToken).toBe('token-ben');
	});

	test('changes nobody else', () => {
		const room = unwrap(setName(seatedRoom(), 'ben', 'Ben K'));
		expect(room.participants.get('ana')?.name).toBe('ANA');
		expect(room.participants.get('cy')?.name).toBe('CY');
	});

	test.each(['', '   ', '\t\n'])('rejects the blank name %p', (name) => {
		expect(applyPure(seatedRoom(), (r) => setName(r, 'ben', name))).toEqual({
			ok: false,
			code: 'NAME_REQUIRED',
		});
	});

	test('accepts a name of exactly the maximum length', () => {
		const name = 'x'.repeat(NAME_MAX_LENGTH);
		expect(unwrap(setName(seatedRoom(), 'ben', name)).participants.get('ben')?.name).toBe(name);
	});

	test('rejects a longer name', () => {
		expect(setName(seatedRoom(), 'ben', 'x'.repeat(NAME_MAX_LENGTH + 1))).toEqual({
			ok: false,
			code: 'NAME_TOO_LONG',
		});
	});

	test('rejects someone who is not in the room', () => {
		expect(setName(seatedRoom(), 'zoe', 'Zoe')).toEqual({ ok: false, code: 'NOT_JOINED' });
	});
});
