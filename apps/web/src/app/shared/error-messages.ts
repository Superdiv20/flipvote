import { type ErrorCode, NAME_MAX_LENGTH } from '@flipvote/protocol';

/**
 * What each server error means to the person who caused it, in the client's words. A `Record`
 * over every `ErrorCode`, so a new code in the protocol doesn't compile until it has a text here.
 * Screens that need wording for their own context (create a room, join) look there first and
 * fall back to this.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_MESSAGE: 'The server didn’t understand that. Reload the page and try again.',
  ROOM_NOT_FOUND: 'This room doesn’t exist anymore.',
  NOT_JOINED: 'You’re no longer seated in this room. Reload the page to join again.',
  ALREADY_IN_ROOM: 'This tab is already connected to another room.',
  NAME_REQUIRED: 'Enter a name.',
  NAME_TOO_LONG: `Names can have at most ${NAME_MAX_LENGTH} characters.`,
  INVALID_SESSION: 'Your session doesn’t match your seat. Reload the page and try again.',
  NOT_FACILITATOR: 'Only the facilitator can do that.',
  SPECTATOR_CANNOT_VOTE: 'You’re watching only. Turn off “Watch only” to vote.',
  INVALID_CARD: 'That card isn’t in this room’s deck.',
  ALREADY_REVEALED: 'The cards are already revealed. Start a new round to vote again.',
  VOTES_LOCKED: 'Everyone has voted, so the votes are locked until the cards flip.',
  NOT_REVEALED: 'The cards aren’t revealed yet.',
  NO_VOTES: 'Nobody has voted yet, so there is nothing to reveal.',
  ISSUE_NOT_FOUND: 'That issue was removed in the meantime.',
  TITLE_REQUIRED: 'Give the issue a title.',
  PARTICIPANT_NOT_FOUND: 'That person has left the room.',
  PARTICIPANT_NOT_CONNECTED: 'That person is away right now. Try again once they’re back.',
};
