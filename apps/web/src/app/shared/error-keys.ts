import {
  type ErrorCode,
  MAX_ISSUES_PER_ROOM,
  NAME_MAX_LENGTH,
  ROOM_NAME_MAX_LENGTH,
} from '@flipvote/protocol';
import { marker } from '@jsverse/transloco-keys-manager/marker';

/**
 * The translation key for each server error code, under `errors.<CODE>`. The server stays
 * language-agnostic: it sends the code, the client says what it means. A `Record` over every
 * `ErrorCode`, so a new code in the protocol doesn't compile until it has a key here. Screens that
 * need wording for their own context (create a room, join) look there first and fall back to this.
 */
const ERROR_KEYS: Record<ErrorCode, string> = {
  INVALID_MESSAGE: marker('errors.INVALID_MESSAGE'),
  ROOM_NOT_FOUND: marker('errors.ROOM_NOT_FOUND'),
  NOT_JOINED: marker('errors.NOT_JOINED'),
  ALREADY_IN_ROOM: marker('errors.ALREADY_IN_ROOM'),
  NAME_REQUIRED: marker('errors.NAME_REQUIRED'),
  NAME_TOO_LONG: marker('errors.NAME_TOO_LONG'),
  INVALID_SESSION: marker('errors.INVALID_SESSION'),
  NOT_FACILITATOR: marker('errors.NOT_FACILITATOR'),
  SPECTATOR_CANNOT_VOTE: marker('errors.SPECTATOR_CANNOT_VOTE'),
  INVALID_CARD: marker('errors.INVALID_CARD'),
  ALREADY_REVEALED: marker('errors.ALREADY_REVEALED'),
  VOTES_LOCKED: marker('errors.VOTES_LOCKED'),
  NOT_REVEALED: marker('errors.NOT_REVEALED'),
  NO_VOTES: marker('errors.NO_VOTES'),
  ISSUE_NOT_FOUND: marker('errors.ISSUE_NOT_FOUND'),
  TITLE_REQUIRED: marker('errors.TITLE_REQUIRED'),
  ISSUE_TOO_LONG: marker('errors.ISSUE_TOO_LONG'),
  TOO_MANY_ISSUES: marker('errors.TOO_MANY_ISSUES'),
  ROOM_NAME_TOO_LONG: marker('errors.ROOM_NAME_TOO_LONG'),
  PARTICIPANT_NOT_FOUND: marker('errors.PARTICIPANT_NOT_FOUND'),
  PARTICIPANT_NOT_CONNECTED: marker('errors.PARTICIPANT_NOT_CONNECTED'),
};

/** For a code this client doesn't know (a newer server), or no code at all. */
export const UNKNOWN_ERROR_KEY = marker('errors.UNKNOWN');

/** The limits some error texts name, passed to every error key. */
export const ERROR_PARAMS = {
  nameMax: NAME_MAX_LENGTH,
  roomNameMax: ROOM_NAME_MAX_LENGTH,
  maxIssues: MAX_ISSUES_PER_ROOM,
};

export function errorKey(code: string | null | undefined): string {
  return code && Object.hasOwn(ERROR_KEYS, code)
    ? ERROR_KEYS[code as ErrorCode]
    : UNKNOWN_ERROR_KEY;
}
