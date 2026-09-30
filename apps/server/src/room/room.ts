import type { CardValue, Deck, ErrorCode, Issue, RoundPhase, RoundResult } from '@flipvote/protocol';

/** Server-side participant. Separate from the protocol type, because it holds server-only fields. */
export interface Participant {
	/** Public: every client sees it. */
	id: string;
	/** Secret: proves a client owns this seat. Never sent to any client. */
	sessionToken: string;
	name: string;
	isSpectator: boolean;
	connected: boolean;
}

/** Server-side room. Never sent as is; `toClientState` builds what a client may see. */
export interface Room {
	id: string;
	name: string;
	deck: Deck;
	phase: RoundPhase;
	/** `null` only while the room is empty. */
	facilitatorId: string | null;
	/** Insertion order is join order. */
	participants: Map<string, Participant>;
	/** participantId → card. Server-only: never sent before the flip. */
	votes: Map<string, CardValue>;
	issues: Issue[];
	currentIssueId: string | null;
	/** Calculated once at the flip, so later changes (someone leaving) don't alter it. */
	result: RoundResult | null;
}

export type RoomResult = { ok: true; room: Room } | { ok: false; code: ErrorCode };

export function createRoom(init: { id: string; name: string; deck: Deck }): Room {
	return {
		id: init.id,
		name: init.name,
		deck: init.deck,
		phase: 'voting',
		facilitatorId: null,
		participants: new Map(),
		votes: new Map(),
		issues: [],
		currentIssueId: null,
		result: null,
	};
}

export function ok(room: Room): RoomResult {
	return { ok: true, room };
}

export function fail(code: ErrorCode): RoomResult {
	return { ok: false, code };
}

/** Back to voting with no votes and no result. */
export function newRound(room: Room): Room {
	return { ...room, phase: 'voting', votes: new Map(), result: null };
}
