export type ErrorCode =
	| 'INVALID_MESSAGE'
	| 'ROOM_NOT_FOUND'
	| 'NOT_JOINED'
	/** Longer than `NAME_MAX_LENGTH` after trimming. */
	| 'NAME_TOO_LONG'
	/** The connection already sits in another room. Open a new connection to join a different one. */
	| 'ALREADY_IN_ROOM'
	| 'NAME_REQUIRED'
	| 'INVALID_SESSION'
	| 'NOT_FACILITATOR'
	| 'SPECTATOR_CANNOT_VOTE'
	| 'INVALID_CARD'
	| 'ALREADY_REVEALED'
	/** The auto flip's countdown runs: votes are locked until the cards are revealed. */
	| 'VOTES_LOCKED'
	| 'NOT_REVEALED'
	| 'NO_VOTES'
	| 'ISSUE_NOT_FOUND'
	| 'TITLE_REQUIRED'
	/** An issue field is longer than its limit in `ISSUE_LIMITS`. */
	| 'ISSUE_TOO_LONG'
	/** The room already has `MAX_ISSUES_PER_ROOM` issues. */
	| 'TOO_MANY_ISSUES'
	/** Longer than `ROOM_NAME_MAX_LENGTH` after trimming. */
	| 'ROOM_NAME_TOO_LONG'
	| 'PARTICIPANT_NOT_FOUND'
	| 'PARTICIPANT_NOT_CONNECTED';
