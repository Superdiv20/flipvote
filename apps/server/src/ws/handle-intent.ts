import type { ClientMessage } from '@flipvote/protocol';
import type { ServerWebSocket } from 'bun';
import { addIssue } from '../room/issues/add-issue';
import { editIssue } from '../room/issues/edit-issue';
import { removeIssue } from '../room/issues/remove-issue';
import { selectIssue } from '../room/issues/select-issue';
import { toggleSpectator } from '../room/participants/toggle-spectator';
import { transferFacilitator } from '../room/participants/transfer-facilitator';
import type { Room, RoomResult } from '../room/room';
import { registry } from '../room/room-registry';
import { changeDeck } from '../room/round/change-deck';
import { flip } from '../room/round/flip';
import { reset } from '../room/round/reset';
import { vote } from '../room/round/vote';
import { ownVote } from '../room/to-shared-state';
import { publish, type Publisher, sendError } from './send';
import type { SocketData } from './socket-data';
import type { StatePublisher } from './state-publisher';
import { seatTopic } from './topics';
import { setName } from '../room/participants/set-name';
import { setAutoFlip } from '../room/round/auto-flip';
import { setOnlyFacilitatorCanFlip } from '../room/round/only-facilitator-can-flip';

/** Intents only read who is sending; only `join` writes it. */
type IntentSocket = Pick<ServerWebSocket<SocketData>, 'send'> & {
	readonly data: Readonly<SocketData>;
};

/** Every message except `join`, which seats the socket and so comes first. */
export type Intent = Exclude<ClientMessage, { type: 'join' }>;

/**
 * Applies an intent from a seated socket: finds its room, runs the matching rule, and on success
 * stores the room and publishes the new state to everyone in it. A failed rule only answers the
 * sender, with the rule's own error code.
 */
export function handleIntent(
	ws: IntentSocket,
	msg: Intent,
	server: Publisher,
	states: StatePublisher,
): void {
	const { roomId, participantId } = ws.data;
	if (roomId === null || participantId === null) {
		sendError(ws, 'NOT_JOINED');
		return;
	}

	const room = registry.getRoom(roomId);
	if (!room) {
		sendError(ws, 'ROOM_NOT_FOUND');
		return;
	}

	const result = applyIntent(room, participantId, msg);
	if (!result.ok) {
		sendError(ws, result.code);
		return;
	}

	registry.updateRoom(result.room);

	// Personal message first, as in `handleJoin`. Only the voter learns the value before the flip,
	// in every tab they have open.
	if (msg.type === 'vote') {
		publish(server, seatTopic(roomId, participantId), {
			type: 'myVote',
			value: ownVote(result.room, participantId),
		});
	}
	states.publishState(result.room);
}

/**
 * The rule each intent maps to. Pure apart from the new issue id. Every case returns, and there is
 * no `default`, so a message type without a case here doesn't compile.
 */
function applyIntent(
	room: Room,
	participantId: string,
	msg: Intent,
): RoomResult {
	switch (msg.type) {
		case 'vote':
			return vote(room, participantId, msg.value);
		case 'flip':
			return flip(room, participantId);
		case 'reset':
			return reset(room, participantId);
		case 'selectIssue':
			return selectIssue(room, participantId, msg.issueId);
		case 'addIssue':
			return addIssue(room, participantId, crypto.randomUUID(), msg.issue);
		case 'updateIssue':
			return editIssue(room, participantId, msg.issueId, msg.changes);
		case 'removeIssue':
			return removeIssue(room, participantId, msg.issueId);
		case 'setDeck':
			return changeDeck(room, participantId, msg.deckId);
		case 'setSpectator':
			return toggleSpectator(room, participantId, msg.spectator);
		case 'transferFacilitator':
			return transferFacilitator(room, participantId, msg.participantId);
		case 'setName':
			return setName(room, participantId, msg.name);
		case 'setAutoFlip':
			return setAutoFlip(room, participantId, msg.enabled);
		case 'setOnlyFacilitatorCanFlip':
			return setOnlyFacilitatorCanFlip(room, participantId, msg.enabled);
	}
}
