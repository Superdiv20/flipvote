import type { ErrorCode, ServerMessage } from '@flipvote/protocol';
import type { Server, ServerWebSocket } from 'bun';
import { ERROR_MESSAGES } from '../shared/error-messages';
import type { SocketData } from './socket-data';

/** Only `send` is needed, so tests can pass a plain `{ send }` object instead of a real socket. */
export type MessageTarget = Pick<ServerWebSocket<SocketData>, 'send'>;

/** Only `publish` is needed, so tests can pass a plain `{ publish }` object instead of the server. */
export type Publisher = Pick<Server<SocketData>, 'publish'>;

/** To one client. */
export function send(ws: MessageTarget, message: ServerMessage): void {
	ws.send(JSON.stringify(message));
}

/** To one client, with the text that belongs to the code. */
export function sendError(ws: MessageTarget, code: ErrorCode): void {
	send(ws, { type: 'error', code, message: ERROR_MESSAGES[code] });
}

/**
 * To everyone subscribed to the room's topic. Uses the server, not the socket: `ws.publish`
 * would skip the sender.
 */
export function publish(server: Publisher, roomId: string, message: ServerMessage): void {
	server.publish(roomId, JSON.stringify(message));
}
