import {
	type ApiError,
	type CreateRoomResponse,
	DECKS,
	type DeckId,
	type ErrorCode,
} from '@flipvote/protocol';
import { registry } from '../room/room-registry';
import { ERROR_MESSAGES } from '../shared/error-messages';
import { isObject } from '../shared/is-object';

/**
 * `POST /api/rooms`. Creates an empty room that remembers the creator's session token, and
 * returns its id. Nobody is seated yet: the creator joins over the socket like everyone else.
 */
export async function createRoomHandler(req: Request): Promise<Response> {
	const token = bearerToken(req);
	if (!token) return error(401, 'INVALID_SESSION');

	const body: unknown = await req.json().catch(() => null);
	if (!isObject(body)) return error(400, 'INVALID_MESSAGE');

	const name = typeof body.name === 'string' ? body.name.trim() : '';
	if (!name) return error(400, 'NAME_REQUIRED');

	const { deckId } = body;
	// `hasOwn`, so keys like `__proto__` or `toString` don't count as decks.
	if (typeof deckId !== 'string' || !Object.hasOwn(DECKS, deckId)) {
		return error(400, 'INVALID_MESSAGE');
	}

	const room = registry.addRoom(name, DECKS[deckId as DeckId], token);
	return Response.json({ roomId: room.id } satisfies CreateRoomResponse, {
		status: 201,
	});
}

function bearerToken(req: Request): string | null {
	return req.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1] ?? null;
}

function error(status: number, code: ErrorCode): Response {
	return Response.json({ code, message: ERROR_MESSAGES[code] } satisfies ApiError, { status });
}
