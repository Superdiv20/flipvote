import { describe, expect, test } from 'bun:test';
import { DECKS } from '@flipvote/protocol';
import { registry } from '../../room/room-registry';
import { ERROR_MESSAGES } from '../../shared/error-messages';
import { createRoomHandler } from '../../http/create-room';

function post(body: unknown, token: string | null = 'token-creator'): Request {
	return new Request('http://localhost/api/rooms', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: typeof body === 'string' ? body : JSON.stringify(body),
	});
}

describe('POST /api/rooms', () => {
	test('creates an empty room that remembers the creator and returns its id', async () => {
		const response = await createRoomHandler(post({ name: '  Sprint 42  ', deckId: 't-shirt' }));
		expect(response.status).toBe(201);

		const { roomId } = await response.json();
		const room = registry.getRoom(roomId);
		expect(room).toMatchObject({ name: 'Sprint 42', creatorToken: 'token-creator', deck: DECKS['t-shirt'] });
		expect(room?.participants.size).toBe(0);
		expect(room?.facilitatorId).toBeNull();
	});

	test('rejects a request without a bearer token', async () => {
		const response = await createRoomHandler(post({ name: 'R', deckId: 'fibonacci' }, null));
		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ code: 'INVALID_SESSION' });
	});

	test('sends the text that belongs to the error code', async () => {
		const response = await createRoomHandler(post({ name: 'R', deckId: 'fibonacci' }, null));
		expect(await response.json()).toEqual({ code: 'INVALID_SESSION', message: ERROR_MESSAGES.INVALID_SESSION });
	});

	test('rejects a blank name', async () => {
		const response = await createRoomHandler(post({ name: '   ', deckId: 'fibonacci' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: 'NAME_REQUIRED' });
	});

	test.each(['unknown', '__proto__', 'toString', 42])('rejects the deck id %p', async (deckId) => {
		const response = await createRoomHandler(post({ name: 'R', deckId }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: 'INVALID_MESSAGE' });
	});

	test('rejects a body that is not a JSON object', async () => {
		for (const body of ['not json', '[]', 'null']) {
			const response = await createRoomHandler(post(body));
			expect(response.status).toBe(400);
		}
	});
});
