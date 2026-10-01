import type { ErrorCode } from '@flipvote/protocol';

/** Messages for the codes `POST /api/rooms` can answer with. */
export const CREATE_ROOM_ERRORS: Partial<Record<ErrorCode, string>> = {
  NAME_REQUIRED: 'Give the room a name.',
  INVALID_MESSAGE: 'The server did not accept the room settings. Check the name and the deck.',
  INVALID_SESSION: 'Your session could not be verified. Reload the page and try again.',
};
