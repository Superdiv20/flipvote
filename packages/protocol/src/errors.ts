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
	| 'PARTICIPANT_NOT_FOUND'
	| 'PARTICIPANT_NOT_CONNECTED';
