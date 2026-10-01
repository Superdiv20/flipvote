import { describe, expect, test } from 'bun:test';
import { DECKS } from '@flipvote/protocol';
import { join, participantIdForToken } from './join';
import { createRoom } from '../room';
import { applyPure, seatedRoom, unwrap } from '../testing';
import { vote } from '../round/vote';

describe('join', () => {
	test('seats a new participant and makes the first one facilitator', () => {
		const empty = createRoom({ id: 'r', name: 'R', deck: DECKS.fibonacci, creatorToken: 'token-creator' });
		const room = unwrap(applyPure(empty, (r) => join(r, 'ana', '  Ana  ', 'token-ana')));
		expect(room.participants.get('ana')).toEqual({
			id: 'ana',
			sessionToken: 'token-ana',
			name: 'Ana',
			isSpectator: false,
			connected: true,
		});
		expect(room.facilitatorId).toBe('ana');

		const withBen = unwrap(join(room, 'ben', 'Ben', 'token-ben'));
		expect(withBen.facilitatorId).toBe('ana');
		expect([...withBen.participants.keys()]).toEqual(['ana', 'ben']);
	});

	test('rejoining keeps the seat, the vote and spectator status', () => {
		let room = unwrap(vote(seatedRoom(), 'ana', '5'));
		room = { ...room, participants: new Map(room.participants).set('ana', { ...room.participants.get('ana')!, connected: false }) };
		const rejoined = unwrap(applyPure(room, (r) => join(r, 'ana', 'Ana K', 'token-ana')));
		expect([...rejoined.participants.keys()]).toEqual(['ana', 'ben', 'cy']);
		expect(rejoined.participants.get('ana')).toMatchObject({ name: 'Ana K', connected: true });
		expect(rejoined.votes.get('ana')).toBe('5');
	});

	test('makes the creator facilitator when they join, even after others', () => {
		const room = unwrap(applyPure(seatedRoom(), (r) => join(r, 'cara', 'Cara', 'token-creator')));
		expect(room.facilitatorId).toBe('cara');
		expect([...room.participants.keys()]).toEqual(['ana', 'ben', 'cy', 'cara']);
	});

	test('does not give the creator the role back when they rejoin', () => {
		let room = unwrap(join(seatedRoom(), 'cara', 'Cara', 'token-creator'));
		room = { ...room, facilitatorId: 'ben' };
		expect(unwrap(join(room, 'cara', 'Cara', 'token-creator')).facilitatorId).toBe('ben');
	});

	test('rejects taking over a seat without its token', () => {
		const room = seatedRoom();
		expect(applyPure(room, (r) => join(r, 'ana', 'Mallory', 'token-mallory'))).toEqual({
			ok: false,
			code: 'INVALID_SESSION',
		});
	});

	test('rejects a blank name', () => {
		expect(join(seatedRoom(), 'dan', '   ', 'token-dan')).toEqual({ ok: false, code: 'NAME_REQUIRED' });
	});
});

describe('participantIdForToken', () => {
	test('finds the seat a token owns', () => {
		expect(participantIdForToken(seatedRoom(), 'token-ben')).toBe('ben');
	});

	test('returns undefined for an unknown token', () => {
		expect(participantIdForToken(seatedRoom(), 'token-dan')).toBeUndefined();
	});
});
