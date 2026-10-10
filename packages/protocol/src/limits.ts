/**
 * Limits both sides apply, so the client can stop a value before sending it and the server
 * rejects the same value when a client doesn't.
 */

/** Display names, after trimming. Long enough for first and last name, short enough for a seat. */
export const NAME_MAX_LENGTH = 40;

/** Room names, after trimming. */
export const ROOM_NAME_MAX_LENGTH = 80;

/** The fields of an issue, after trimming. Long enough for real tickets, short enough for every state. */
export const ISSUE_LIMITS = {
	key: 30,
	title: 50,
	link: 100,
	description: 1000,
} as const;

/** Issues in one room. Every state carries all of them. */
export const MAX_ISSUES_PER_ROOM = 200;
