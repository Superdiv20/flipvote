import type { ErrorCode } from './errors';
import type { DeckId } from './model';

/**
 * `POST /api/rooms`, with the creator's session token as `Authorization: Bearer <token>`.
 * Creates the room without seating anyone; the creator joins over the socket afterwards.
 */
export interface CreateRoomRequest {
	name: string;
	deckId: DeckId;
}

/** `201 Created`. */
export interface CreateRoomResponse {
	roomId: string;
}

/** Body of every failed HTTP request. */
export interface ApiError {
	code: ErrorCode;
	message: string;
}
