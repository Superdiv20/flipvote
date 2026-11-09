import type { ErrorCode } from '@flipvote/protocol';
import { marker } from '@jsverse/transloco-keys-manager/marker';

/** Wording for the codes `POST /api/rooms` can answer with. Other codes use the shared error keys. */
export const CREATE_ROOM_ERRORS: Partial<Record<ErrorCode, string>> = {
  NAME_REQUIRED: marker('createRoom.errors.NAME_REQUIRED'),
  INVALID_MESSAGE: marker('createRoom.errors.INVALID_MESSAGE'),
  INVALID_SESSION: marker('createRoom.errors.INVALID_SESSION'),
};
