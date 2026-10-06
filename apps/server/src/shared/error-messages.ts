import { type ErrorCode, NAME_MAX_LENGTH } from '@flipvote/protocol';

/**
 * The human-readable text sent along with each error code, over HTTP and the socket alike, so the
 * texts stay neutral about where they are shown. A `Record` over every `ErrorCode`, so a new code
 * in the protocol doesn't compile until it has a text here. Clients pick their own wording by code.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	INVALID_MESSAGE: 'The message could not be understood.',
	ROOM_NOT_FOUND: 'This room does not exist or has closed.',
	NOT_JOINED: 'Join the room first.',
	ALREADY_IN_ROOM: 'This connection is already in another room.',
	NAME_REQUIRED: 'A name is required.',
	NAME_TOO_LONG: `A name can have at most ${NAME_MAX_LENGTH} characters.`,
	INVALID_SESSION: 'Your session could not be verified.',
	NOT_FACILITATOR: 'Only the facilitator can do that.',
	SPECTATOR_CANNOT_VOTE: 'Spectators cannot vote.',
	INVALID_CARD: 'That card is not in this deck.',
	ALREADY_REVEALED: 'The cards are already revealed.',
	NOT_REVEALED: 'The cards are not revealed yet.',
	NO_VOTES: 'Nobody has voted yet.',
	ISSUE_NOT_FOUND: 'That issue does not exist.',
	TITLE_REQUIRED: 'Give the issue a title.',
	PARTICIPANT_NOT_FOUND: 'That participant is not in this room.',
	PARTICIPANT_NOT_CONNECTED: 'That participant is not connected.',
};
