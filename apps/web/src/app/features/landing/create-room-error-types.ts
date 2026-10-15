import type { ErrorCode } from '@flipvote/protocol';
import { marker } from '@jsverse/transloco-keys-manager/marker';

/** Wording for the codes `POST /api/rooms` can answer with. Other codes use the shared error keys. */
export const CREATE_ROOM_ERRORS: Partial<Record<ErrorCode, string>> = {
  NAME_REQUIRED: marker('landing.errors.NAME_REQUIRED'),
  INVALID_MESSAGE: marker('landing.errors.INVALID_MESSAGE'),
  INVALID_SESSION: marker('landing.errors.INVALID_SESSION'),
};
