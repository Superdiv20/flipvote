import { describe, expect, test } from 'bun:test';
import type { ClientMessage } from '@flipvote/protocol';
import { parseMessage } from '../../ws/parse-message';

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

describe('parseMessage: vote', () => {
	test('accepts a card', () => {
		expect(parseMessage(frame({ type: 'vote', value: '5' }))).toEqual({ type: 'vote', value: '5' });
	});

	test('accepts null to withdraw the vote', () => {
		expect(parseMessage(frame({ type: 'vote', value: null }))).toEqual({ type: 'vote', value: null });
	});

	test('leaves a card outside the deck to the vote rule', () => {
		expect(parseMessage(frame({ type: 'vote', value: '999' }))).toEqual({ type: 'vote', value: '999' });
	});

	test.each([
		['a missing value', { type: 'vote' }],
		['an empty value', { type: 'vote', value: '' }],
		['a numeric value', { type: 'vote', value: 5 }],
		['the old field name', { type: 'vote', vote: '5' }],
	])('rejects %s', (_, value) => {
		expect(parseMessage(frame(value))).toBeNull();
	});
});

describe('parseMessage: flip and reset', () => {
	test.each(['flip', 'reset'])('accepts %p and drops anything else sent along', (type) => {
		expect(parseMessage(frame({ type, force: true }))).toEqual({ type });
	});
});

describe('parseMessage: setDeck', () => {
	test.each(['fibonacci', 'modified-fibonacci', 't-shirt'])('accepts the deck %p', (deckId) => {
		expect(parseMessage(frame({ type: 'setDeck', deckId }))).toEqual({ type: 'setDeck', deckId });
	});

	test.each(['numbers', '', '__proto__', 'toString', 42, undefined])('rejects the deck id %p', (deckId) => {
		expect(parseMessage(frame({ type: 'setDeck', deckId }))).toBeNull();
	});
});

describe('parseMessage: addIssue', () => {
	const full = { key: 'ATL-1', title: 'Export', link: 'https://example.com', description: 'Notes' };

	test('accepts a title alone, as quick add sends it', () => {
		expect(parseMessage(frame({ type: 'addIssue', issue: { title: 'Export' } }))).toEqual({
			type: 'addIssue',
			issue: { title: 'Export' },
		});
	});

	test('accepts every field, as the dialog sends them', () => {
		expect(parseMessage(frame({ type: 'addIssue', issue: full }))).toEqual({ type: 'addIssue', issue: full });
	});

	test('drops fields an issue does not have, including the estimate', () => {
		expect(parseMessage(frame({ type: 'addIssue', issue: { ...full, estimate: '8', id: 'x' } }))).toEqual({
			type: 'addIssue',
			issue: full,
		});
	});

	test('leaves a blank title to the rule', () => {
		expect(parseMessage(frame({ type: 'addIssue', issue: { title: '  ' } }))).toEqual({
			type: 'addIssue',
			issue: { title: '  ' },
		});
	});

	test.each([
		['no issue', { type: 'addIssue' }],
		['an issue that is not an object', { type: 'addIssue', issue: 'Export' }],
		['an issue array', { type: 'addIssue', issue: [] }],
		['a missing title', { type: 'addIssue', issue: { key: 'ATL-1' } }],
		['a numeric title', { type: 'addIssue', issue: { title: 1 } }],
		['a numeric key', { type: 'addIssue', issue: { title: 'Export', key: 1 } }],
		['a null link', { type: 'addIssue', issue: { title: 'Export', link: null } }],
	])('rejects %s', (_, value) => {
		expect(parseMessage(frame(value))).toBeNull();
	});
});

describe('parseMessage: updateIssue', () => {
	test('accepts only the fields that change', () => {
		expect(parseMessage(frame({ type: 'updateIssue', issueId: 'i1', changes: { title: 'New' } }))).toEqual({
			type: 'updateIssue',
			issueId: 'i1',
			changes: { title: 'New' },
		});
	});

	test('accepts an empty string to clear an optional field', () => {
		expect(parseMessage(frame({ type: 'updateIssue', issueId: 'i1', changes: { link: '' } }))).toEqual({
			type: 'updateIssue',
			issueId: 'i1',
			changes: { link: '' },
		});
	});

	test('drops the estimate, which clients cannot change', () => {
		expect(parseMessage(frame({ type: 'updateIssue', issueId: 'i1', changes: { estimate: '13' } }))).toEqual({
			type: 'updateIssue',
			issueId: 'i1',
			changes: {},
		});
	});

	test.each([
		['a missing issue id', { type: 'updateIssue', changes: { title: 'New' } }],
		['an empty issue id', { type: 'updateIssue', issueId: '', changes: { title: 'New' } }],
		['no changes', { type: 'updateIssue', issueId: 'i1' }],
		['changes that are not an object', { type: 'updateIssue', issueId: 'i1', changes: 'New' }],
		['a numeric field', { type: 'updateIssue', issueId: 'i1', changes: { description: 7 } }],
	])('rejects %s', (_, value) => {
		expect(parseMessage(frame(value))).toBeNull();
	});
});

describe('parseMessage: selectIssue and removeIssue', () => {
	test.each(['selectIssue', 'removeIssue'])('accepts %p with an issue id', (type) => {
		expect(parseMessage(frame({ type, issueId: 'i1', extra: 1 }))).toEqual({ type, issueId: 'i1' });
	});

	test.each([
		['selectIssue', undefined],
		['selectIssue', ''],
		['removeIssue', 7],
		['removeIssue', null],
	])('rejects %p with the issue id %p', (type, issueId) => {
		expect(parseMessage(frame({ type, issueId }))).toBeNull();
	});
});

describe('parseMessage: setSpectator', () => {
	test.each([true, false])('accepts %p', (spectator) => {
		expect(parseMessage(frame({ type: 'setSpectator', spectator }))).toEqual({ type: 'setSpectator', spectator });
	});

	test.each(['true', 1, null, undefined])('rejects %p, which is not a boolean', (spectator) => {
		expect(parseMessage(frame({ type: 'setSpectator', spectator }))).toBeNull();
	});
});

describe('parseMessage: transferFacilitator', () => {
	test('accepts a participant id', () => {
		expect(parseMessage(frame({ type: 'transferFacilitator', participantId: 'ben' }))).toEqual({
			type: 'transferFacilitator',
			participantId: 'ben',
		});
	});

	test.each([undefined, '', 3])('rejects the participant id %p', (participantId) => {
		expect(parseMessage(frame({ type: 'transferFacilitator', participantId }))).toBeNull();
	});
});

describe('parseMessage: setName', () => {
	test('accepts a name as it was sent', () => {
		expect(parseMessage(frame({ type: 'setName', name: '  Ana K  ' }))).toEqual({ type: 'setName', name: '  Ana K  ' });
	});

	test('leaves a blank or too long name to the rule', () => {
		expect(parseMessage(frame({ type: 'setName', name: '   ' }))).toEqual({ type: 'setName', name: '   ' });
		expect(parseMessage(frame({ type: 'setName', name: 'x'.repeat(500) }))).not.toBeNull();
	});

	test.each([undefined, null, 42, { first: 'Ana' }])('rejects the name %p, which is not a string', (name) => {
		expect(parseMessage(frame({ type: 'setName', name }))).toBeNull();
	});
});

describe('parseMessage: setAutoFlip', () => {
	test.each([true, false])('accepts %p', (enabled) => {
		expect(parseMessage(frame({ type: 'setAutoFlip', enabled }))).toEqual({ type: 'setAutoFlip', enabled });
	});

	test.each(['true', 1, null, undefined])('rejects %p, which is not a boolean', (enabled) => {
		expect(parseMessage(frame({ type: 'setAutoFlip', enabled }))).toBeNull();
	});
});

describe('parseMessage: coverage', () => {
	// One valid example per message type. The `Record` makes this fail to compile when the
	// protocol gains a type without an example here, and the test fails when the parser lacks a case.
	const examples: { [T in ClientMessage['type']]: Extract<ClientMessage, { type: T }> } = {
		join: validJoin as Extract<ClientMessage, { type: 'join' }>,
		vote: { type: 'vote', value: '5' },
		flip: { type: 'flip' },
		reset: { type: 'reset' },
		selectIssue: { type: 'selectIssue', issueId: 'i1' },
		addIssue: { type: 'addIssue', issue: { title: 'Export' } },
		updateIssue: { type: 'updateIssue', issueId: 'i1', changes: { title: 'New' } },
		removeIssue: { type: 'removeIssue', issueId: 'i1' },
		setDeck: { type: 'setDeck', deckId: 't-shirt' },
		setSpectator: { type: 'setSpectator', spectator: true },
		transferFacilitator: { type: 'transferFacilitator', participantId: 'ben' },
		setName: { type: 'setName', name: 'Ana K' },
		setAutoFlip: { type: 'setAutoFlip', enabled: true },
	};

	test.each(Object.values(examples))('parses every message type: $type', (message) => {
		expect(parseMessage(frame(message))).toEqual(message);
	});
});
