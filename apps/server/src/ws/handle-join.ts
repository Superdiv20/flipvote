import type { ClientMessage } from '@flipvote/protocol';
import type { ServerWebSocket } from 'bun';
import { join, participantIdForToken } from '../room/participants/join';
import { registry } from '../room/room-registry';
import { ownVote, toSharedState } from '../room/to-shared-state';
import { publish, type Publisher, send, sendError } from './send';
import type { SocketData } from './socket-data';

type JoiningSocket = Pick<ServerWebSocket<SocketData>, 'send' | 'subscribe' | 'data'>;

/**
 * Seats the sender: finds the room, resolves its seat by token, applies the `join` rule, then
 * sends `welcome` to the joiner and the new state to everyone in the room. A connection stays
 * in one room; joining the same room again is a rejoin.
 */
export function handleJoin(
	ws: JoiningSocket,
	msg: Extract<ClientMessage, { type: 'join' }>,
	server: Publisher,
): void {
	if (ws.data.roomId !== null && ws.data.roomId !== msg.roomId) {
		sendError(ws, 'ALREADY_IN_ROOM');
		return;
	}

	const currentRoom = registry.getRoom(msg.roomId);
	if (!currentRoom) {
		sendError(ws, 'ROOM_NOT_FOUND');
		return;
	}

	const participantId =
		participantIdForToken(currentRoom, msg.sessionToken) ?? crypto.randomUUID();

	const result = join(currentRoom, participantId, msg.name, msg.sessionToken);
	if (!result.ok) {
		sendError(ws, result.code);
		return;
	}

	const { room } = result;
	registry.updateRoom(room);

	ws.data.roomId = room.id;
	ws.data.participantId = participantId;
	ws.subscribe(room.id);

	send(ws, { type: 'welcome', participantId, myVote: ownVote(room, participantId) });
	publish(server, room.id, { type: 'state', room: toSharedState(room) });
}
