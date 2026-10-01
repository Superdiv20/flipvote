import { type ApiError, type CreateRoomResponse, DECKS, type DeckId, type ErrorCode } from '@flipvote/protocol';
import { registry } from '../room/room-registry';

/**
 * `POST /api/rooms`. Creates an empty room that remembers the creator's session token, and
 * returns its id. Nobody is seated yet: the creator joins over the socket like everyone else.
 */
export async function createRoomHandler(req: Request): Promise<Response> {
	const token = bearerToken(req);
	if (!token) return error(401, 'INVALID_SESSION', 'Send the session token as a bearer token.');

	const body: unknown = await req.json().catch(() => null);
	if (!isObject(body)) return error(400, 'INVALID_MESSAGE', 'Expected a JSON object.');

	const name = typeof body.name === 'string' ? body.name.trim() : '';
	if (!name) return error(400, 'NAME_REQUIRED', 'Give the room a name.');

	const { deckId } = body;
	// `hasOwn`, so keys like `__proto__` or `toString` don't count as decks.
	if (typeof deckId !== 'string' || !Object.hasOwn(DECKS, deckId)) {
		return error(400, 'INVALID_MESSAGE', 'Unknown deck.');
	}

	const room = registry.addRoom(name, DECKS[deckId as DeckId], token);
	return Response.json({ roomId: room.id } satisfies CreateRoomResponse, { status: 201 });
}

function bearerToken(req: Request): string | null {
	return req.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1] ?? null;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function error(status: number, code: ErrorCode, message: string): Response {
	return Response.json({ code, message } satisfies ApiError, { status });
}
