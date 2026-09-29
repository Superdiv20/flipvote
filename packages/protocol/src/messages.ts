import type { ErrorCode } from './errors';
import type { CardValue, DeckId, IssueInput, RoomState } from './model';

/**
 * Intents a client sends. The server validates them and answers with a fresh `state`
 * for everyone in the room, or an `error` to the sender.
 */
export type ClientMessage =
	/** Anyone. Rejoins the same seat when `sessionToken` is known. */
	| { type: 'join'; roomId: string; name: string; sessionToken?: string }
	/** Non-spectators, while voting. `null` withdraws the vote. */
	| { type: 'vote'; value: CardValue | null }
	/** Facilitator. Reveals the cards. */
	| { type: 'flip' }
	/** Facilitator. Records the suggested estimate on the current issue, moves on and starts a new round. */
	| { type: 'reset' }
	/** Facilitator. Makes the issue current and starts a new round. */
	| { type: 'selectIssue'; issueId: string }
	/** Anyone. Quick add sends only `key` and `title`, the dialog sends all fields. */
	| { type: 'addIssue'; issue: IssueInput }
	/** Anyone. The estimate cannot be changed. */
	| { type: 'updateIssue'; issueId: string; changes: Partial<IssueInput> }
	/** Facilitator. */
	| { type: 'removeIssue'; issueId: string }
	/** Facilitator. Starts a new round with the new deck. */
	| { type: 'setDeck'; deckId: DeckId }
	/** The sender, for themselves. */
	| { type: 'setSpectator'; spectator: boolean }
	/** Facilitator. Hands the role to another participant. */
	| { type: 'transferFacilitator'; participantId: string };

export type ServerMessage =
	/** Sent only to the joining client. Store the token to rejoin the same seat after a refresh. */
	| { type: 'welcome'; sessionToken: string; participantId: string }
	| { type: 'state'; room: RoomState }
	/** Sent only to the client whose intent failed. */
	| { type: 'error'; code: ErrorCode; message: string };
