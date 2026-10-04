export type ErrorCode =
	| 'INVALID_MESSAGE'
	| 'ROOM_NOT_FOUND'
	| 'NOT_JOINED'
	/** The connection already sits in another room. Open a new connection to join a different one. */
	| 'ALREADY_IN_ROOM'
	| 'NAME_REQUIRED'
	| 'INVALID_SESSION'
	| 'NOT_FACILITATOR'
	| 'SPECTATOR_CANNOT_VOTE'
	| 'INVALID_CARD'
	| 'ALREADY_REVEALED'
	| 'NOT_REVEALED'
	| 'NO_VOTES'
	| 'ISSUE_NOT_FOUND'
	| 'TITLE_REQUIRED'
	| 'PARTICIPANT_NOT_FOUND'
	| 'PARTICIPANT_NOT_CONNECTED';
	
