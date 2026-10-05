import { parseMessage } from './ws/parse-message';
import type { SocketData } from './ws/socket-data';
import { createRoomHandler } from './http/create-room';
import { sendError } from './ws/send';
import { handleIntent } from './ws/handle-intent';
import { handleClose } from './ws/handle-close';
import { handleJoin } from './ws/handle-join';
import { createPresence } from './ws/presence';
import { registry } from './room/room-registry';

/** A room nobody has joined within this time is removed, e.g. when it was created and the tab closed. */
const UNJOINED_ROOM_MS = 10 * 60_000;
const SWEEP_INTERVAL_MS = 60_000;

const server = Bun.serve({
	port: 3000,
	routes: {
		'/api/rooms': { POST: createRoomHandler },
	},
	fetch(req, server) {
		if (
			new URL(req.url).pathname === '/ws' &&
			server.upgrade(req, {
				data: { roomId: null, participantId: null },
			})
		)
			return;
		return new Response('Flipvote server running');
	},
	websocket: {
		data: {} as SocketData,
		open(ws) {
			console.log('client connected');
		},
		message(ws, raw) {
			const msg = parseMessage(raw);
			if (!msg) {
				sendError(ws, 'INVALID_MESSAGE');
				return;
			}
			switch (msg.type) {
				case 'join':
					handleJoin(ws, msg, server, presence);
					break;
				default:
					handleIntent(ws, msg, server);
					break;
			}
		},
		close(ws) {
			handleClose(ws, server, presence);
		},
	},
});

const presence = createPresence(server);

setInterval(() => registry.removeEmptyRooms(Date.now() - UNJOINED_ROOM_MS), SWEEP_INTERVAL_MS);

console.log(`Listening on ${server.url}`);
