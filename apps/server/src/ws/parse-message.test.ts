import { describe, expect, test } from 'bun:test';
import type { ClientMessage } from '@flipvote/protocol';
import { parseMessage } from './parse-message';

const validJoin: ClientMessage = { type: 'join', roomId: 'room-1', name: 'Ana', sessionToken: 'token-ana' };
const frame = (value: unknown) => JSON.stringify(value);

describe('parseMessage', () => {
	test('returns a valid join with exactly its fields', () => {
		expect(parseMessage(frame(validJoin))).toEqual(validJoin);
	});

	test('accepts a Buffer frame', () => {
		expect(parseMessage(Buffer.from(frame(validJoin)))).toEqual(validJoin);
	});

	test('drops fields the protocol does not know', () => {
		expect(parseMessage(frame({ ...validJoin, isAdmin: true }))).toEqual(validJoin);
	});

	test('leaves a blank name to the join rule', () => {
		expect(parseMessage(frame({ ...validJoin, name: '   ' }))).toEqual({ ...validJoin, name: '   ' });
	});

	test.each([
		['a missing session token', { ...validJoin, sessionToken: undefined }],
		['an empty session token', { ...validJoin, sessionToken: '' }],
		['an empty room id', { ...validJoin, roomId: '' }],
		['a numeric room id', { ...validJoin, roomId: 42 }],
		['a missing name', { ...validJoin, name: undefined }],
		['an unknown type', { ...validJoin, type: 'hack' }],
		['no type', { roomId: 'room-1' }],
	])('rejects %s', (_, value) => {
		expect(parseMessage(frame(value))).toBeNull();
	});

	test.each(['not json', '[]', 'null', '"join"', '42'])('rejects the frame %p', (raw) => {
		expect(parseMessage(raw)).toBeNull();
	});
});
