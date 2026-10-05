import type { Server } from 'bun';
import type { Presence } from './presence';
import type { SocketData } from './socket-data';
import { seatTopic } from './topics';

type ClosingSocket = { readonly data: Readonly<SocketData> };
type SubscriberCounter = Pick<Server<SocketData>, 'subscriberCount'>;

/**
 * A socket closed. Only when it was the seat's last open tab does the seat count as away; another
 * tab of the same person keeps it connected.
 */
export function handleClose(
	ws: ClosingSocket,
	server: SubscriberCounter,
	presence: Pick<Presence, 'lastSocketClosed'>,
): void {
	const { roomId, participantId } = ws.data;
	if (roomId === null || participantId === null) return;

	// Bun has already unsubscribed the closing socket here, so this counts only the other tabs.
	if (server.subscriberCount(seatTopic(roomId, participantId)) > 0) return;
	presence.lastSocketClosed(roomId, participantId);
}
